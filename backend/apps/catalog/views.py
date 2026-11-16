from adrf.views import APIView
from asgiref.sync import sync_to_async
from django.db.models import Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.accounts.permissions import IsAdminUserRole
from apps.core.exceptions import ApiError
from apps.core.pagination import paginate

from . import services
from .filters import ORDERINGS, ProductFilter, apply_ordering
from .models import Category, Product, ProductImage
from .serializers import (
    AdminProductSerializer,
    AdminProductStatusSerializer,
    AdminProductWriteSerializer,
    CategorySerializer,
    ProductDetailSerializer,
    ProductImageUploadSerializer,
    ProductListSerializer,
)

TAG = ["Catalogue"]
ADMIN_TAG = ["Admin Catalogue"]


class PublicView(APIView):
    authentication_classes: list = []
    permission_classes = [AllowAny]


class ProductListView(PublicView):
    @extend_schema(
        tags=TAG,
        parameters=[
            OpenApiParameter("q", str, description="Search name, description, category, ingredient"),
            OpenApiParameter("category", str, description="Category slug"),
            OpenApiParameter("min_price", float),
            OpenApiParameter("max_price", float),
            OpenApiParameter("in_stock", bool),
            OpenApiParameter("vegan", bool),
            OpenApiParameter("vegetarian", bool),
            OpenApiParameter("featured", bool),
            OpenApiParameter("form", str, description="Comma separated: capsule,tablet,..."),
            OpenApiParameter("exclude_allergens", str, description="Comma separated allergen slugs"),
            OpenApiParameter("ordering", str, enum=list(ORDERINGS)),
            OpenApiParameter("page", int),
            OpenApiParameter("page_size", int),
        ],
        responses=ProductListSerializer(many=True),
        summary="List and search products",
    )
    async def get(self, request):
        queryset = ProductFilter(request.query_params, queryset=services.list_queryset()).qs
        queryset = apply_ordering(queryset, request.query_params.get("ordering"))
        return await paginate(request, queryset, ProductListSerializer, context={"request": request})


class ProductFacetsView(PublicView):
    @extend_schema(tags=TAG, responses={200: dict}, summary="Filter options with counts")
    async def get(self, request):
        return Response(await services.facets())


class ProductDetailView(PublicView):
    @extend_schema(tags=TAG, responses=ProductDetailSerializer, summary="Product detail")
    async def get(self, request, slug: str):
        product = await services.get_product_by_slug(slug)
        return Response(ProductDetailSerializer(product, context={"request": request}).data)


class CategoryListView(PublicView):
    @extend_schema(tags=TAG, responses=CategorySerializer(many=True), summary="Categories")
    async def get(self, request):
        return Response(CategorySerializer(await services.list_categories(), many=True).data)


class CategoryDetailView(PublicView):
    @extend_schema(tags=TAG, responses=CategorySerializer, summary="Category detail")
    async def get(self, request, slug: str):
        return Response(CategorySerializer(await services.get_category(slug)).data)


# -----------------------------------------------------------------------------
# Admin Catalogue Views
# -----------------------------------------------------------------------------


class AdminBaseView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]


class AdminProductListCreateView(AdminBaseView):
    @extend_schema(
        tags=ADMIN_TAG,
        parameters=[
            OpenApiParameter("q", str, description="Search by name, SKU, slug or category"),
            OpenApiParameter("category", str, description="Category slug"),
            OpenApiParameter("is_active", str, description="'true' or 'false'"),
            OpenApiParameter(
                "stock_status",
                str,
                enum=["in_stock", "low_stock", "out_of_stock"],
                description="Stock status filter",
            ),
            OpenApiParameter("ordering", str, description="Ordering field"),
            OpenApiParameter("page", int),
            OpenApiParameter("page_size", int),
        ],
        responses=AdminProductSerializer(many=True),
        summary="Admin list products (all states)",
    )
    async def get(self, request):
        qs = Product.objects.all().select_related("category").prefetch_related("images")

        q = request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(
                Q(name__icontains=q)
                | Q(sku__icontains=q)
                | Q(slug__icontains=q)
                | Q(category__name__icontains=q)
            )

        category = request.query_params.get("category", "").strip()
        if category and category != "All":
            qs = qs.filter(category__slug=category)

        is_active = request.query_params.get("is_active")
        if is_active in ("true", "True", "1"):
            qs = qs.filter(is_active=True)
        elif is_active in ("false", "False", "0"):
            qs = qs.filter(is_active=False)

        stock_status = request.query_params.get("stock_status")
        if stock_status == "out_of_stock":
            qs = qs.filter(stock=0)
        elif stock_status == "low_stock":
            qs = qs.filter(stock__gt=0, stock__lte=5)
        elif stock_status == "in_stock":
            qs = qs.filter(stock__gt=0)

        ordering = request.query_params.get("ordering", "-created_at")
        allowed_orderings = {
            "name", "-name", "price", "-price", "stock", "-stock",
            "created_at", "-created_at", "updated_at", "-updated_at"
        }
        if ordering in allowed_orderings:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by("-created_at")

        return await paginate(request, qs, AdminProductSerializer, context={"request": request})

    @extend_schema(
        tags=ADMIN_TAG,
        request=AdminProductWriteSerializer,
        responses={201: AdminProductSerializer},
        summary="Admin create a product",
    )
    async def post(self, request):
        def _validate_and_create():
            serializer = AdminProductWriteSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            return serializer.save()

        product = await sync_to_async(_validate_and_create)()
        full_product = await (
            Product.objects.select_related("category")
            .prefetch_related("images")
            .aget(pk=product.pk)
        )
        return Response(
            AdminProductSerializer(full_product, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class AdminProductDetailView(AdminBaseView):
    async def _get_product_or_404(self, pk: int) -> Product:
        try:
            return await (
                Product.objects.select_related("category")
                .prefetch_related("images")
                .aget(pk=pk)
            )
        except Product.DoesNotExist:
            raise ApiError("Product not found.", code="not_found", status_code=404)

    @extend_schema(tags=ADMIN_TAG, responses=AdminProductSerializer, summary="Admin get product detail")
    async def get(self, request, pk: int):
        product = await self._get_product_or_404(pk)
        return Response(AdminProductSerializer(product, context={"request": request}).data)

    @extend_schema(
        tags=ADMIN_TAG,
        request=AdminProductWriteSerializer,
        responses=AdminProductSerializer,
        summary="Admin update product",
    )
    async def patch(self, request, pk: int):
        product = await self._get_product_or_404(pk)

        def _validate_and_update():
            serializer = AdminProductWriteSerializer(product, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            return serializer.save()

        await sync_to_async(_validate_and_update)()
        updated = await self._get_product_or_404(pk)
        return Response(AdminProductSerializer(updated, context={"request": request}).data)

    @extend_schema(
        tags=ADMIN_TAG,
        request=AdminProductWriteSerializer,
        responses=AdminProductSerializer,
        summary="Admin replace product",
    )
    async def put(self, request, pk: int):
        product = await self._get_product_or_404(pk)

        def _validate_and_replace():
            serializer = AdminProductWriteSerializer(product, data=request.data, partial=False)
            serializer.is_valid(raise_exception=True)
            return serializer.save()

        await sync_to_async(_validate_and_replace)()
        updated = await self._get_product_or_404(pk)
        return Response(AdminProductSerializer(updated, context={"request": request}).data)

    @extend_schema(tags=ADMIN_TAG, responses={204: None}, summary="Admin archive product (safe soft-delete)")
    async def delete(self, request, pk: int):
        product = await self._get_product_or_404(pk)
        product.is_active = False
        await product.asave(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminProductStatusToggleView(AdminBaseView):
    @extend_schema(
        tags=ADMIN_TAG,
        request=AdminProductStatusSerializer,
        responses=AdminProductSerializer,
        summary="Admin publish or unpublish product",
    )
    async def patch(self, request, pk: int):
        try:
            product = await (
                Product.objects.select_related("category")
                .prefetch_related("images")
                .aget(pk=pk)
            )
        except Product.DoesNotExist:
            raise ApiError("Product not found.", code="not_found", status_code=404)

        serializer = AdminProductStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product.is_active = serializer.validated_data["is_active"]
        await product.asave(update_fields=["is_active", "updated_at"])
        return Response(AdminProductSerializer(product, context={"request": request}).data)


class AdminProductImageUploadView(AdminBaseView):
    parser_classes = [MultiPartParser, FormParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "upload"

    @extend_schema(
        tags=ADMIN_TAG,
        request={"multipart/form-data": ProductImageUploadSerializer},
        responses={201: AdminProductSerializer},
        summary="Admin upload/replace product photo",
    )
    async def post(self, request, pk: int):
        try:
            product = await (
                Product.objects.select_related("category")
                .prefetch_related("images")
                .aget(pk=pk)
            )
        except Product.DoesNotExist:
            raise ApiError("Product not found.", code="not_found", status_code=404)

        def _upload():
            serializer = ProductImageUploadSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
            if data.get("replace"):
                for existing in product.images.all():
                    if existing.image:
                        existing.image.delete(save=False)
                    existing.delete()
            ProductImage.objects.create(
                product=product,
                image=data["image"],
                alt_text=data.get("alt_text", "") or product.name,
                sort_order=data.get("sort_order", 0),
            )

        await sync_to_async(_upload)()
        updated = await (
            Product.objects.select_related("category")
            .prefetch_related("images")
            .aget(pk=pk)
        )
        return Response(
            AdminProductSerializer(updated, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class AdminProductImageDeleteView(AdminBaseView):
    @extend_schema(tags=ADMIN_TAG, responses={204: None}, summary="Admin delete product image")
    async def delete(self, request, pk: int, image_id: int):
        def _delete_img():
            img = ProductImage.objects.filter(product_id=pk, pk=image_id).first()
            if img:
                if img.image:
                    img.image.delete(save=False)
                img.delete()
                return True
            return False

        deleted = await sync_to_async(_delete_img)()
        if not deleted:
            raise ApiError("Image not found.", code="not_found", status_code=404)
        return Response(status=status.HTTP_204_NO_CONTENT)
