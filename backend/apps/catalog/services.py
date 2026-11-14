"""Public door of the catalog module."""
from __future__ import annotations

from django.db.models import Count, Max, Min, Prefetch, Q

from apps.core.exceptions import ApiError

from .models import Category, Product, ProductIngredient


def active_products():
    return Product.objects.filter(is_active=True, category__is_active=True)


def list_queryset():
    return active_products().select_related("category").prefetch_related("images")


def detail_queryset():
    return active_products().select_related("category").prefetch_related(
        "images",
        Prefetch(
            "product_ingredients",
            queryset=ProductIngredient.objects.select_related("ingredient").prefetch_related(
                "ingredient__allergens"
            ),
        ),
    )


async def get_product_by_slug(slug: str) -> Product:
    product = await detail_queryset().filter(slug=slug).afirst()
    if product is None:
        raise ApiError("Product not found.", code="not_found", status_code=404)
    return product


async def get_active_products_by_ids(ids) -> dict[int, Product]:
    return {
        p.pk: p
        async for p in list_queryset().filter(pk__in=list(ids))
    }


async def list_categories():
    return [
        c
        async for c in Category.objects.filter(is_active=True).annotate(
            product_count=Count("products", filter=Q(products__is_active=True))
        )
    ]


async def get_category(slug: str) -> Category:
    cat = await Category.objects.filter(slug=slug, is_active=True).annotate(
        product_count=Count("products", filter=Q(products__is_active=True))
    ).afirst()
    if cat is None:
        raise ApiError("Category not found.", code="not_found", status_code=404)
    return cat


async def facets() -> dict:
    qs = active_products()
    price = await qs.aaggregate(min=Min("price"), max=Max("price"))
    forms = [
        {"value": r["form"], "count": r["n"]}
        async for r in qs.values("form").annotate(n=Count("id")).order_by("form")
    ]
    return {
        "categories": [
            {"slug": c.slug, "name": c.name, "count": c.product_count} for c in await list_categories()
        ],
        "forms": forms,
        "price": {"min": price["min"], "max": price["max"]},
    }
