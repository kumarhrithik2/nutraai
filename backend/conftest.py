import pytest
from django.core.cache import cache
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api_client():
    return APIClient()


REGISTER = {"full_name": "Asha Patil", "email": "asha@example.com",
            "password": "Str0ng!Passw0rd", "accept_terms": True}


@pytest.fixture
def user(db):
    from apps.accounts.models import User
    from apps.profiles import services

    u = User.objects.create_user("asha@example.com", "Str0ng!Passw0rd")
    services.create_profile(u, full_name="Asha Patil")
    return u


@pytest.fixture
def auth_client(api_client, user):
    from rest_framework_simplejwt.tokens import RefreshToken

    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}")
    return api_client


@pytest.fixture
def catalog(db):
    """Two categories, three products; 'whey' contains dairy, 'fish-oil' contains fish."""
    from decimal import Decimal

    from apps.catalog.models import Allergen, Category, Ingredient, Product, ProductIngredient

    vit = Category.objects.create(name="Vitamins", slug="vitamins")
    omega = Category.objects.create(name="Omega", slug="omega")
    d3 = Product.objects.create(name="Vitamin D3", slug="vitamin-d3", sku="D3", category=vit,
                                short_description="D3", price=Decimal("200"), mrp=Decimal("250"),
                                stock=10, is_vegan=True, is_featured=True)
    fish = Product.objects.create(name="Fish Oil", slug="fish-oil", sku="FO", category=omega,
                                  short_description="Omega", price=Decimal("600"), mrp=Decimal("700"),
                                  stock=3)
    out = Product.objects.create(name="Zinc", slug="zinc", sku="ZN", category=vit,
                                 short_description="Zinc", price=Decimal("100"), mrp=Decimal("100"),
                                 stock=0)
    allergen = Allergen.objects.get(slug="fish")
    ing = Ingredient.objects.create(name="Fish oil", slug="fish-oil")
    ing.allergens.add(allergen)
    ProductIngredient.objects.create(product=fish, ingredient=ing, amount="1000 mg")
    return {"d3": d3, "fish": fish, "zinc": out}
