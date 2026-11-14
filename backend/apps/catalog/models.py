from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import F, Q

from apps.core.models import TimeStampedModel


class Category(TimeStampedModel):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=80, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Allergen(models.Model):
    """Slugs match the assessment allergy choices (nuts, soy, dairy, gluten, fish, shellfish, other)."""

    slug = models.SlugField(max_length=30, unique=True)
    name = models.CharField(max_length=60)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Ingredient(TimeStampedModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    allergens = models.ManyToManyField(Allergen, blank=True, related_name="ingredients")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    class Form(models.TextChoices):
        CAPSULE = "capsule", "Capsule"
        TABLET = "tablet", "Tablet"
        SOFTGEL = "softgel", "Softgel"
        GUMMY = "gummy", "Gummy"
        POWDER = "powder", "Powder"
        LIQUID = "liquid", "Liquid"

    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=160, unique=True)
    sku = models.CharField(max_length=40, unique=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    short_description = models.CharField(max_length=240)
    description = models.TextField(blank=True)
    benefits = models.JSONField(default=list, blank=True, help_text="List of short strings.")
    usage_directions = models.TextField(blank=True)
    warnings = models.TextField(blank=True)
    form = models.CharField(max_length=12, choices=Form.choices, default=Form.CAPSULE)
    serving_size = models.CharField(max_length=60, blank=True, help_text='e.g. "1 capsule daily"')
    servings_per_pack = models.PositiveIntegerField(default=30)
    price = models.DecimalField(max_digits=9, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    mrp = models.DecimalField(max_digits=9, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    stock = models.PositiveIntegerField(default=0, help_text="Units available to sell.")
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_vegan = models.BooleanField(default=False)
    is_vegetarian = models.BooleanField(default=True)
    requires_doctor_approval = models.BooleanField(
        default=False, help_text="Used by the safety filter (e.g. pregnancy)."
    )
    ingredients = models.ManyToManyField(Ingredient, through="ProductIngredient", related_name="products")

    class Meta:
        ordering = ["-is_featured", "name"]
        indexes = [
            models.Index(fields=["is_active", "category"]),
            models.Index(fields=["is_active", "price"]),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(mrp__gte=F("price")), name="product_mrp_gte_price"),
        ]

    def __str__(self):
        return self.name

    @property
    def in_stock(self) -> bool:
        return self.stock > 0

    @property
    def discount_percent(self) -> int:
        if self.mrp and self.mrp > self.price:
            return int(((self.mrp - self.price) / self.mrp * 100).quantize(Decimal("1")))
        return 0


class ProductIngredient(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="product_ingredients")
    ingredient = models.ForeignKey(Ingredient, on_delete=models.PROTECT, related_name="product_links")
    amount = models.CharField(max_length=60, blank=True, help_text='e.g. "1000 IU"')
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        constraints = [
            models.UniqueConstraint(fields=["product", "ingredient"], name="uniq_product_ingredient")
        ]

    def __str__(self):
        return f"{self.product_id}:{self.ingredient_id}"


def product_image_path(instance, filename: str) -> str:
    return f"products/{instance.product_id}/{filename}"


class ProductImage(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to=product_image_path)
    alt_text = models.CharField(max_length=160, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"Image {self.pk} of {self.product_id}"
