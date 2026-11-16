from decimal import Decimal
import io
import pytest
from PIL import Image
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.catalog.models import Category, Product, ProductImage
from apps.profiles.models import Profile

pytestmark = pytest.mark.django_db
ADMIN_PRODUCTS_URL = "/api/v1/admin/products/"
PUBLIC_PRODUCTS_URL = "/api/v1/products/"


@pytest.fixture
def admin_user(db):
    user = User.objects.create_user("admin@nutraai.com", "AdminPass123!")
    user.role = User.Role.ADMIN
    user.is_staff = True
    user.is_superuser = True
    user.save()
    Profile.objects.create(user=user, full_name="Admin Test")
    return user


@pytest.fixture
def admin_client(api_client, admin_user):
    token = RefreshToken.for_user(admin_user).access_token
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api_client


@pytest.fixture
def test_category(db):
    return Category.objects.create(name="Daily Essentials", slug="daily-essentials")


def _generate_test_image():
    file = io.BytesIO()
    image = Image.new("RGBA", size=(50, 50), color=(155, 0, 0))
    image.save(file, "png")
    file.name = "test_product.png"
    file.seek(0)
    return file


def test_admin_permissions(admin_client, user):
    from rest_framework.test import APIClient

    # Anonymous -> 401
    anon = APIClient()
    r_anon = anon.get(ADMIN_PRODUCTS_URL)
    assert r_anon.status_code == 401

    # Customer user -> 403
    cust = APIClient()
    cust_token = RefreshToken.for_user(user).access_token
    cust.credentials(HTTP_AUTHORIZATION=f"Bearer {cust_token}")
    r_cust = cust.get(ADMIN_PRODUCTS_URL)
    assert r_cust.status_code == 403

    # Admin user -> 200
    r_admin = admin_client.get(ADMIN_PRODUCTS_URL)
    assert r_admin.status_code == 200


def test_admin_create_product(admin_client, test_category):
    payload = {
        "name": "CoQ10 Ubiquinol 100mg",
        "sku": "NUTRA-CQ10",
        "category_id": test_category.id,
        "short_description": "Cardiovascular support",
        "description": "High absorption active antioxidant support.",
        "form": "softgel",
        "price": "499.00",
        "mrp": "599.00",
        "stock": 45,
        "is_active": True,
    }
    r = admin_client.post(ADMIN_PRODUCTS_URL, payload, format="json")
    assert r.status_code == 201, r.data
    data = r.data
    assert data["name"] == "CoQ10 Ubiquinol 100mg"
    assert data["sku"] == "NUTRA-CQ10"
    assert data["slug"] == "coq10-ubiquinol-100mg"
    assert data["stock"] == 45
    assert data["in_stock"] is True
    assert data["is_active"] is True
    assert Decimal(data["price"]) == Decimal("499.00")
    assert Decimal(data["mrp"]) == Decimal("599.00")


def test_admin_create_validations(admin_client, test_category):
    # MRP must be >= price
    bad_price = {
        "name": "Vitamin E",
        "sku": "NUTRA-VITE",
        "category_id": test_category.id,
        "price": "500.00",
        "mrp": "400.00",  # Invalid: mrp < price
        "stock": 10,
    }
    r = admin_client.post(ADMIN_PRODUCTS_URL, bad_price, format="json")
    assert r.status_code == 400
    assert "mrp" in r.data or "error" in r.data

    # Duplicate SKU validation
    good = {
        "name": "Vitamin E",
        "sku": "NUTRA-VITE",
        "category_id": test_category.id,
        "price": "400.00",
        "mrp": "500.00",
        "stock": 10,
    }
    r_ok = admin_client.post(ADMIN_PRODUCTS_URL, good, format="json")
    assert r_ok.status_code == 201

    r_dup = admin_client.post(ADMIN_PRODUCTS_URL, good, format="json")
    assert r_dup.status_code == 400
    assert "sku" in r_dup.data or "error" in r_dup.data


def test_admin_update_product(admin_client, test_category):
    prod = Product.objects.create(
        name="Zinc Picolinate",
        slug="zinc-picolinate",
        sku="NUTRA-ZN-PIC",
        category=test_category,
        short_description="Immunity support",
        price=Decimal("199.00"),
        mrp=Decimal("249.00"),
        stock=20,
    )

    update_payload = {
        "price": "219.00",
        "mrp": "279.00",
        "stock": 50,
        "name": "Zinc Picolinate 50mg",
    }
    r = admin_client.patch(f"{ADMIN_PRODUCTS_URL}{prod.id}/", update_payload, format="json")
    assert r.status_code == 200, r.data
    assert Decimal(r.data["price"]) == Decimal("219.00")
    assert Decimal(r.data["mrp"]) == Decimal("279.00")
    assert r.data["stock"] == 50
    assert r.data["name"] == "Zinc Picolinate 50mg"


def test_admin_archive_and_marketplace_reflection(api_client, admin_client, test_category):
    prod = Product.objects.create(
        name="Ashwagandha KSM-66",
        slug="ashwagandha-ksm-66",
        sku="NUTRA-ASHWA",
        category=test_category,
        short_description="Stress relief",
        price=Decimal("350.00"),
        mrp=Decimal("450.00"),
        stock=15,
        is_active=True,
    )

    # 1. Product is visible in customer marketplace
    pub_r = api_client.get(f"{PUBLIC_PRODUCTS_URL}{prod.slug}/")
    assert pub_r.status_code == 200

    # 2. Admin soft-archives product
    del_r = admin_client.delete(f"{ADMIN_PRODUCTS_URL}{prod.id}/")
    assert del_r.status_code == 204

    prod.refresh_from_db()
    assert prod.is_active is False

    # 3. Product is now immediately hidden from customer marketplace
    pub_after = api_client.get(f"{PUBLIC_PRODUCTS_URL}{prod.slug}/")
    assert pub_after.status_code == 404

    # 4. Product still exists and is listed in admin catalogue (with is_active=False)
    admin_list = admin_client.get(ADMIN_PRODUCTS_URL, {"is_active": "false"})
    assert admin_list.status_code == 200
    assert any(p["id"] == prod.id for p in admin_list.data["results"])


def test_admin_status_toggle(admin_client, test_category):
    prod = Product.objects.create(
        name="Iron Chelate",
        slug="iron-chelate",
        sku="NUTRA-FE",
        category=test_category,
        price=Decimal("150.00"),
        mrp=Decimal("200.00"),
        stock=10,
        is_active=True,
    )

    r_unpub = admin_client.patch(
        f"{ADMIN_PRODUCTS_URL}{prod.id}/status/", {"is_active": False}, format="json"
    )
    assert r_unpub.status_code == 200
    assert r_unpub.data["is_active"] is False

    r_pub = admin_client.patch(
        f"{ADMIN_PRODUCTS_URL}{prod.id}/status/", {"is_active": True}, format="json"
    )
    assert r_pub.status_code == 200
    assert r_pub.data["is_active"] is True


def test_admin_image_upload_and_delete(admin_client, test_category):
    prod = Product.objects.create(
        name="Probiotics 50 Billion",
        slug="probiotics-50-billion",
        sku="NUTRA-PROBIO",
        category=test_category,
        price=Decimal("799.00"),
        mrp=Decimal("999.00"),
        stock=30,
    )

    # Upload image
    img = _generate_test_image()
    r = admin_client.post(
        f"{ADMIN_PRODUCTS_URL}{prod.id}/images/",
        {"image": img, "alt_text": "Bottle front"},
        format="multipart",
    )
    assert r.status_code == 201, r.data
    assert len(r.data["images"]) == 1
    image_id = r.data["images"][0]["id"]
    assert "test_product" in r.data["images"][0]["url"]

    # Delete image
    r_del = admin_client.delete(f"{ADMIN_PRODUCTS_URL}{prod.id}/images/{image_id}/")
    assert r_del.status_code == 204
    assert ProductImage.objects.filter(pk=image_id).count() == 0
