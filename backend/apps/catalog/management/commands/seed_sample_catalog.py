"""Load fake launch products for local/staging use. Refuses to run in production."""
from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.catalog.models import Allergen, Category, Ingredient, Product, ProductIngredient

CATEGORIES = [
    ("Vitamins", "vitamins"), ("Minerals", "minerals"), ("Herbal & Wellness", "herbal-wellness"),
    ("Omega & Heart", "omega-heart"), ("Women's Health", "womens-health"),
    ("Sports Nutrition", "sports-nutrition"),
]

# slug, name, category, form, price, mrp, stock, vegan, doctor, ingredients[(name, amount, [allergens])]
PRODUCTS = [
    ("multivitamin", "Daily Multivitamin", "vitamins", "tablet", "399", "499", 120, True, False,
     [("Vitamin C", "80 mg", []), ("Zinc", "10 mg", [])]),
    ("vitamin-d3", "Vitamin D3 1000 IU", "vitamins", "softgel", "249", "299", 200, False, False,
     [("Vitamin D3", "1000 IU", [])]),
    ("vitamin-b12", "Vitamin B12 500 mcg", "vitamins", "tablet", "199", "249", 150, True, False,
     [("Vitamin B12", "500 mcg", [])]),
    ("vitamin-c", "Vitamin C 500 mg", "vitamins", "tablet", "179", "229", 180, True, False,
     [("Vitamin C", "500 mg", [])]),
    ("zinc", "Zinc 15 mg", "minerals", "tablet", "149", "199", 90, True, False,
     [("Zinc", "15 mg", [])]),
    ("magnesium", "Magnesium Glycinate", "minerals", "capsule", "349", "429", 80, True, False,
     [("Magnesium", "200 mg", [])]),
    ("omega-3", "Omega-3 Fish Oil", "omega-heart", "softgel", "599", "749", 60, False, False,
     [("Fish oil", "1000 mg", ["fish"])]),
    ("ashwagandha", "Ashwagandha Root Extract", "herbal-wellness", "capsule", "449", "549", 70, True, True,
     [("Ashwagandha", "600 mg", [])]),
    ("whey-protein", "Whey Protein", "sports-nutrition", "powder", "1499", "1799", 40, False, False,
     [("Whey protein", "24 g", ["dairy"]), ("Soy lecithin", "1 g", ["soy"])]),
]


class Command(BaseCommand):
    help = "Create sample categories, allergens, ingredients and products (idempotent)."

    @transaction.atomic
    def handle(self, *args, **options):
        if settings.ENVIRONMENT == "production":
            raise CommandError("Refusing to seed sample data in production.")
        cats = {slug: Category.objects.get_or_create(slug=slug, defaults={"name": name})[0]
                for name, slug in CATEGORIES}
        allergens = {a.slug: a for a in Allergen.objects.all()}
        for slug, name, cat, form, price, mrp, stock, vegan, doctor, ings in PRODUCTS:
            product, _ = Product.objects.update_or_create(
                slug=slug,
                defaults=dict(
                    name=name, sku=f"NA-{slug.upper()}", category=cats[cat],
                    short_description=f"{name} for everyday wellness.",
                    description=f"{name}. Educational information only; not medical advice.",
                    benefits=["Supports daily nutrition"], form=form,
                    serving_size="1 serving daily", servings_per_pack=30,
                    price=Decimal(price), mrp=Decimal(mrp), stock=stock, is_vegan=vegan,
                    is_vegetarian=True, requires_doctor_approval=doctor,
                    is_featured=slug in {"multivitamin", "vitamin-d3"},
                    warnings="Consult a doctor before use if pregnant or on medication.",
                ),
            )
            for order, (ing_name, amount, alg) in enumerate(ings):
                ing, _ = Ingredient.objects.get_or_create(
                    name=ing_name, defaults={"slug": ing_name.lower().replace(" ", "-")}
                )
                ing.allergens.set([allergens[s] for s in alg if s in allergens])
                ProductIngredient.objects.update_or_create(
                    product=product, ingredient=ing, defaults={"amount": amount, "sort_order": order}
                )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(PRODUCTS)} products."))
