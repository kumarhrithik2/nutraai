import django_filters as df
from django.db.models import Q

from .models import Product

ORDERINGS = {
    "featured": ("-is_featured", "name"),
    "price_asc": ("price", "name"),
    "price_desc": ("-price", "name"),
    "name": ("name",),
    "newest": ("-created_at", "-id"),
}


class ProductFilter(df.FilterSet):
    """Slug/value based only, so building it never touches the database (async safe)."""

    q = df.CharFilter(method="filter_search", label="Search")
    category = df.CharFilter(field_name="category__slug")
    min_price = df.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = df.NumberFilter(field_name="price", lookup_expr="lte")
    in_stock = df.BooleanFilter(method="filter_in_stock")
    vegan = df.BooleanFilter(field_name="is_vegan")
    vegetarian = df.BooleanFilter(field_name="is_vegetarian")
    featured = df.BooleanFilter(field_name="is_featured")
    form = df.CharFilter(method="filter_form")
    exclude_allergens = df.CharFilter(method="filter_exclude_allergens")

    class Meta:
        model = Product
        fields: list[str] = []

    def filter_search(self, queryset, name, value):
        value = value.strip()
        if not value:
            return queryset
        with_ingredient = Product.objects.filter(ingredients__name__icontains=value).values("pk")
        return queryset.filter(
            Q(name__icontains=value)
            | Q(short_description__icontains=value)
            | Q(category__name__icontains=value)
            | Q(pk__in=with_ingredient)
        )

    def filter_in_stock(self, queryset, name, value):
        if value is None:
            return queryset
        return queryset.filter(stock__gt=0) if value else queryset.filter(stock=0)

    def filter_form(self, queryset, name, value):
        forms = [v.strip() for v in value.split(",") if v.strip()]
        return queryset.filter(form__in=forms) if forms else queryset

    def filter_exclude_allergens(self, queryset, name, value):
        slugs = [v.strip() for v in value.split(",") if v.strip()]
        if not slugs:
            return queryset
        bad = Product.objects.filter(ingredients__allergens__slug__in=slugs).values("pk")
        return queryset.exclude(pk__in=bad)


def apply_ordering(queryset, value: str | None):
    return queryset.order_by(*ORDERINGS.get(value or "featured", ORDERINGS["featured"]))
