from adrf.views import APIView
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.core.pagination import paginate
from apps.payments import services as payment_services

from . import services
from .serializers import (
    AddToCartSerializer,
    CartSerializer,
    CheckoutResponseSerializer,
    CheckoutSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    PaymentInitSerializer,
    SetQuantitySerializer,
    validate_idempotency_key,
)

CART = ["Cart"]
ORD = ["Orders"]


class CartView(APIView):
    @extend_schema(tags=CART, responses=CartSerializer, summary="My cart with totals")
    async def get(self, request):
        return Response(CartSerializer(await services.get_cart_view(request.user),
                                       context={"request": request}).data)

    @extend_schema(tags=CART, responses={204: None}, summary="Empty the cart")
    async def delete(self, request):
        await services.clear_cart(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartItemsView(APIView):
    @extend_schema(tags=CART, request=AddToCartSerializer, responses=CartSerializer,
                   summary="Add a product (adds to existing quantity)")
    async def post(self, request):
        s = AddToCartSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        cart = await services.add_to_cart(request.user, **s.validated_data)
        return Response(CartSerializer(cart, context={"request": request}).data,
                        status=status.HTTP_201_CREATED)


class CartItemDetailView(APIView):
    @extend_schema(tags=CART, request=SetQuantitySerializer, responses=CartSerializer,
                   summary="Set the quantity of a cart item")
    async def patch(self, request, product_id: int):
        s = SetQuantitySerializer(data=request.data)
        s.is_valid(raise_exception=True)
        cart = await services.set_cart_quantity(request.user, product_id, s.validated_data["quantity"])
        return Response(CartSerializer(cart, context={"request": request}).data)

    @extend_schema(tags=CART, responses=CartSerializer, summary="Remove an item")
    async def delete(self, request, product_id: int):
        cart = await services.remove_from_cart(request.user, product_id)
        return Response(CartSerializer(cart, context={"request": request}).data)


class CheckoutView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "checkout"

    @extend_schema(
        tags=ORD, request=CheckoutSerializer, responses={201: CheckoutResponseSerializer},
        parameters=[OpenApiParameter("Idempotency-Key", str, OpenApiParameter.HEADER, required=False,
                                     description="Repeat the same key to safely retry a checkout.")],
        summary="Place an order from the cart and start the payment",
    )
    async def post(self, request):
        s = CheckoutSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        key = validate_idempotency_key(request.headers.get("Idempotency-Key"))
        order, payment = await services.checkout(
            request.user, address_id=s.validated_data["address_id"], idempotency_key=key,
            notes=s.validated_data["notes"],
            payment_method=s.validated_data.get("payment_method", "online"),
            request=request,
        )
        body = {"order": OrderDetailSerializer(order).data,
                "payment": PaymentInitSerializer(payment).data if payment else None}
        return Response(body, status=status.HTTP_201_CREATED)


class OrderListView(APIView):
    @extend_schema(tags=ORD, responses=OrderListSerializer(many=True), summary="My order history")
    async def get(self, request):
        return await paginate(request, services.orders_for(request.user), OrderListSerializer)


class OrderDetailView(APIView):
    @extend_schema(tags=ORD, responses=OrderDetailSerializer, summary="Order detail")
    async def get(self, request, number: str):
        return Response(OrderDetailSerializer(await services.get_order(request.user, number)).data)


class OrderCancelView(APIView):
    @extend_schema(tags=ORD, request=None, responses=OrderDetailSerializer,
                   summary="Cancel an unpaid order and release its stock")
    async def post(self, request, number: str):
        order = await services.cancel_order(request.user, number, request=request)
        return Response(OrderDetailSerializer(order).data)


class OrderArchiveView(APIView):
    @extend_schema(tags=ORD, request=None, responses={204: None},
                   summary="Remove an eligible order from the customer's order list")
    async def post(self, request, number: str):
        await services.archive_order_for_customer(request.user, number, request=request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrderPayView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "checkout"

    @extend_schema(tags=ORD, request=None, responses=PaymentInitSerializer,
                   summary="Get payment details again for an unpaid order")
    async def post(self, request, number: str):
        order = await services.get_order(request.user, number)
        if getattr(order, "payment_method", "online") == "cod":
            from apps.core.exceptions import ApiError
            raise ApiError("Cash on Delivery orders do not require online payment.",
                           code="cod_no_online_payment", status_code=409)
        payment = await payment_services.initiate_payment(order)
        return Response(PaymentInitSerializer(payment).data)
