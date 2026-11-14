from django.contrib import admin

from .models import Allergen, Category, Ingredient, Product, ProductImage, ProductIngredient


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "sort_order")
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ("is_active", "sort_order")


@admin.register(Allergen)
class AllergenAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ("name", "allergen_list")
    search_fields = ("name",)
    filter_horizontal = ("allergens",)
    prepopulated_fields = {"slug": ("name",)}

    @admin.display(description="Allergens")
    def allergen_list(self, obj):
        return ", ".join(a.name for a in obj.allergens.all())

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("allergens")


class ProductIngredientInline(admin.TabularInline):
    model = ProductIngredient
    extra = 1
    autocomplete_fields = ("ingredient",)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "category", "price", "mrp", "stock", "is_active", "is_featured")
    list_filter = ("is_active", "is_featured", "category", "form", "is_vegan",
                   "requires_doctor_approval")
    list_editable = ("price", "stock", "is_active", "is_featured")
    search_fields = ("name", "sku", "slug")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductIngredientInline, ProductImageInline]
    list_select_related = ("category",)
