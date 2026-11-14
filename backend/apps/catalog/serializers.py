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


class ProductListSerializer(serializers.ModelSerializer):
    """Needs: select_related('category'), prefetch_related('images')."""

    category = CategoryBriefSerializer(read_only=True)
    image = serializers.SerializerMethodField()
    in_stock = serializers.BooleanField(read_only=True)
    low_stock = serializers.SerializerMethodField()
    discount_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = ["id", "slug", "name", "short_description", "category", "form", "serving_size",
                  "price", "mrp", "discount_percent", "in_stock", "low_stock", "is_vegan",
                  "is_vegetarian", "is_featured", "image"]

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
            "sku", "description", "benefits", "usage_directions", "warnings", "servings_per_pack",
            "requires_doctor_approval", "images", "ingredients", "allergens",
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
