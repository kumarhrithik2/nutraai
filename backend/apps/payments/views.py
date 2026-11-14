from adrf.views import APIView
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.orders.serializers import OrderDetailSerializer

from . import services
from .serializers import VerifyPaymentSerializer


class VerifyPaymentView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "checkout"

    @extend_schema(tags=["Payments"], request=VerifyPaymentSerializer, responses=OrderDetailSerializer,
                   summary="Confirm a payment after the Razorpay widget succeeds")
    async def post(self, request):
        s = VerifyPaymentSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        order = await services.verify_payment(
            request.user, gateway_order_id=d["razorpay_order_id"],
            gateway_payment_id=d["razorpay_payment_id"], signature=d["razorpay_signature"],
            request=request,
        )
        return Response(OrderDetailSerializer(order).data)


class WebhookView(APIView):
    """Called by Razorpay. Authenticated only by the HMAC signature of the raw body."""

    authentication_classes: list = []
    permission_classes = [AllowAny]
    throttle_classes: list = []

    @extend_schema(tags=["Payments"], request=None, responses={200: dict}, summary="Razorpay webhook")
    async def post(self, request):
        raw = request._request.body  # exact bytes: the signature covers them
        outcome = await services.handle_webhook(
            raw,
            request.headers.get("X-Razorpay-Signature", ""),
            request.headers.get("X-Razorpay-Event-Id", ""),
        )
        return Response({"status": outcome})
