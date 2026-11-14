from adrf.views import APIView
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.core.pagination import paginate

from . import services
from .filters import ORDERINGS, ProductFilter, apply_ordering
from .serializers import CategorySerializer, ProductDetailSerializer, ProductListSerializer

TAG = ["Catalogue"]


class PublicView(APIView):
    authentication_classes: list = []
    permission_classes = [AllowAny]


class ProductListView(PublicView):
    @extend_schema(
        tags=TAG,
        parameters=[
            OpenApiParameter("q", str, description="Search name, description, category, ingredient"),
            OpenApiParameter("category", str, description="Category slug"),
            OpenApiParameter("min_price", float), OpenApiParameter("max_price", float),
            OpenApiParameter("in_stock", bool), OpenApiParameter("vegan", bool),
            OpenApiParameter("vegetarian", bool), OpenApiParameter("featured", bool),
            OpenApiParameter("form", str, description="Comma separated: capsule,tablet,..."),
            OpenApiParameter("exclude_allergens", str, description="Comma separated allergen slugs"),
            OpenApiParameter("ordering", str, enum=list(ORDERINGS)),
            OpenApiParameter("page", int), OpenApiParameter("page_size", int),
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
