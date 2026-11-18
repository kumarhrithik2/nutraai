from decimal import Decimal

from django.utils.text import slugify
from rest_framework import serializers

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "product_count"]


class CategoryBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["name", "slug"]


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["url", "alt_text"]

    def get_url(self, obj) -> str:
        url = obj.image.url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request and url.startswith("/") else url


class ProductImageDetailSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "url", "alt_text", "sort_order", "created_at"]

    def get_url(self, obj) -> str:
        url = obj.image.url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request and url.startswith("/") else url


class ProductImageUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()
    alt_text = serializers.CharField(max_length=160, required=False, allow_blank=True, default="")
    sort_order = serializers.IntegerField(required=False, default=0)
    replace = serializers.BooleanField(required=False, default=False)

    def validate_image(self, value):
        max_bytes = 5 * 1024 * 1024  # 5 MB
        if value.size > max_bytes:
            raise serializers.ValidationError("Image must be 5 MB or smaller.")
        content_type = getattr(value, "content_type", "")
        if content_type and content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise serializers.ValidationError("Only JPEG, PNG or WebP images are allowed.")
        return value


class ProductListSerializer(serializers.ModelSerializer):
    """Needs: select_related('category'), prefetch_related('images')."""

    category = CategoryBriefSerializer(read_only=True)
    image = serializers.SerializerMethodField()
    in_stock = serializers.BooleanField(read_only=True)
    low_stock = serializers.SerializerMethodField()
    discount_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "slug",
            "name",
            "short_description",
            "category",
            "form",
            "serving_size",
            "price",
            "mrp",
            "discount_percent",
            "stock",
            "in_stock",
            "low_stock",
            "is_vegan",
            "is_vegetarian",
            "is_featured",
            "image",
        ]

    def get_image(self, obj) -> dict | None:
        images = list(obj.images.all())
        return ProductImageSerializer(images[0], context=self.context).data if images else None

    def get_low_stock(self, obj) -> bool:
        return 0 < obj.stock <= 5


class ProductDetailSerializer(ProductListSerializer):
    """Needs: select_related('category'), prefetch images + product_ingredients__ingredient__allergens."""

    images = serializers.SerializerMethodField()
    ingredients = serializers.SerializerMethodField()
    allergens = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            "sku",
            "description",
            "benefits",
            "usage_directions",
            "warnings",
            "servings_per_pack",
            "requires_doctor_approval",
            "images",
            "ingredients",
            "allergens",
        ]

    def get_images(self, obj) -> list:
        return ProductImageSerializer(obj.images.all(), many=True, context=self.context).data

    def get_ingredients(self, obj) -> list:
        return [{"name": pi.ingredient.name, "amount": pi.amount} for pi in obj.product_ingredients.all()]

    def get_allergens(self, obj) -> list:
        found = {}
        for pi in obj.product_ingredients.all():
            for allergen in pi.ingredient.allergens.all():
                found[allergen.slug] = allergen.name
        return [{"slug": s, "name": n} for s, n in sorted(found.items())]


# -----------------------------------------------------------------------------
# Admin serializers
# -----------------------------------------------------------------------------


class AdminProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", read_only=False
    )
    images = ProductImageDetailSerializer(many=True, read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    low_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "sku",
            "category",
            "category_id",
            "short_description",
            "description",
            "benefits",
            "usage_directions",
            "warnings",
            "form",
            "serving_size",
            "servings_per_pack",
            "price",
            "mrp",
            "discount_percent",
            "stock",
            "in_stock",
            "low_stock",
            "is_active",
            "is_featured",
            "is_vegan",
            "is_vegetarian",
            "requires_doctor_approval",
            "images",
            "created_at",
            "updated_at",
        ]

    def get_low_stock(self, obj) -> bool:
        return 0 < obj.stock <= 5


class AdminProductWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category"
    )
    slug = serializers.SlugField(max_length=160, required=False, allow_blank=True)
    sku = serializers.CharField(max_length=40)
    short_description = serializers.CharField(max_length=240, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    benefits = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    usage_directions = serializers.CharField(required=False, allow_blank=True)
    warnings = serializers.CharField(required=False, allow_blank=True)
    form = serializers.ChoiceField(choices=Product.Form.choices, default=Product.Form.CAPSULE)
    serving_size = serializers.CharField(max_length=60, required=False, allow_blank=True)
    servings_per_pack = serializers.IntegerField(min_value=1, default=30)
    price = serializers.DecimalField(max_digits=9, decimal_places=2, min_value=Decimal("0.01"))
    mrp = serializers.DecimalField(max_digits=9, decimal_places=2, min_value=Decimal("0.01"))
    stock = serializers.IntegerField(min_value=0, default=0)
    is_active = serializers.BooleanField(required=False, default=True)
    is_featured = serializers.BooleanField(required=False, default=False)
    is_vegan = serializers.BooleanField(required=False, default=False)
    is_vegetarian = serializers.BooleanField(required=False, default=True)
    requires_doctor_approval = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = Product
        fields = [
            "name",
            "slug",
            "sku",
            "category_id",
            "short_description",
            "description",
            "benefits",
            "usage_directions",
            "warnings",
            "form",
            "serving_size",
            "servings_per_pack",
            "price",
            "mrp",
            "stock",
            "is_active",
            "is_featured",
            "is_vegan",
            "is_vegetarian",
            "requires_doctor_approval",
        ]

    def validate_sku(self, value):
        sku = value.strip().upper()
        if not sku:
            raise serializers.ValidationError("SKU cannot be empty.")
        qs = Product.objects.filter(sku__iexact=sku)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A product with this SKU already exists.")
        return sku

    def validate_slug(self, value):
        slug = slugify(value.strip())
        if slug:
            qs = Product.objects.filter(slug=slug)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("A product with this slug already exists.")
        return slug

    def validate(self, attrs):
        price = attrs.get("price")
        mrp = attrs.get("mrp")
        if price is None and self.instance:
            price = self.instance.price
        if mrp is None and self.instance:
            mrp = self.instance.mrp

        if price is not None and mrp is not None and mrp < price:
            raise serializers.ValidationError(
                {"mrp": "MRP (original price) must be greater than or equal to selling price."}
            )

        name = attrs.get("name")
        slug = attrs.get("slug")
        if not slug and name:
            base_slug = slugify(name)
            candidate = base_slug
            counter = 1
            qs = Product.objects.all()
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            while qs.filter(slug=candidate).exists():
                candidate = f"{base_slug}-{counter}"
                counter += 1
            attrs["slug"] = candidate

        return attrs


class AdminProductStatusSerializer(serializers.Serializer):
    is_active = serializers.BooleanField()
