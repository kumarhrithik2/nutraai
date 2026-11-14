import hashlib
import hmac
from datetime import timedelta

import pytest
from django.conf import settings
from django.core import mail
from django.utils import timezone

from apps.catalog.models import Product
from apps.orders.models import Order
from apps.orders.services import cancel_expired_orders_sync

pytestmark = pytest.mark.django_db
ADDR = {"full_name": "Asha Patil", "phone": "9876543210", "line1": "12 MG Road",
        "city": "Nashik", "state": "Maharashtra", "pincode": "422001"}


def sign(order_id, payment_id):
    return hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), f"{order_id}|{payment_id}".encode(),
                    hashlib.sha256).hexdigest()


@pytest.fixture
def address(auth_client):
    return auth_client.post("/api/v1/addresses/", ADDR).data["id"]


def fill_cart(client, catalog, qty=2):
    r = client.post("/api/v1/cart/items/", {"product_id": catalog["d3"].pk, "quantity": qty})
    assert r.status_code == 201, r.content
    return r


def test_cart_flow_and_totals(auth_client, catalog):
    r = fill_cart(auth_client, catalog)
    assert r.data["subtotal"] == "400.00" and r.data["shipping_fee"] == "49.00"
    assert r.data["total"] == "449.00" and r.data["item_count"] == 2
    r = auth_client.post("/api/v1/cart/items/", {"product_id": catalog["d3"].pk, "quantity": 1})
    assert r.data["item_count"] == 3
    r = auth_client.patch(f"/api/v1/cart/items/{catalog['d3'].pk}/", {"quantity": 3})
    assert r.data["shipping_fee"] == "0.00" or r.data["subtotal"] == "600.00"
    assert auth_client.delete(f"/api/v1/cart/items/{catalog['d3'].pk}/").data["item_count"] == 0


def test_cart_limits(auth_client, catalog):
    assert auth_client.post("/api/v1/cart/items/", {"product_id": catalog["zinc"].pk}).status_code == 409
    assert auth_client.post("/api/v1/cart/items/", {"product_id": catalog["fish"].pk,
                                                    "quantity": 4}).data["error"]["code"] == "insufficient_stock"
    assert auth_client.post("/api/v1/cart/items/", {"product_id": 9999}).status_code == 404


def test_checkout_pay_verify(auth_client, catalog, address, django_capture_on_commit_callbacks):
    fill_cart(auth_client, catalog)
    r = auth_client.post("/api/v1/checkout/", {"address_id": address}, HTTP_IDEMPOTENCY_KEY="key-12345678")
    assert r.status_code == 201, r.content
    order, pay = r.data["order"], r.data["payment"]
    assert order["status"] == "pending_payment" and pay["amount"] == 44900
    catalog["d3"].refresh_from_db()
    assert catalog["d3"].stock == 8  # reserved
    assert auth_client.get("/api/v1/cart/").data["item_count"] == 0

    # same key => same order, no second reservation
    again = auth_client.post("/api/v1/checkout/", {"address_id": address}, HTTP_IDEMPOTENCY_KEY="key-12345678")
    assert again.data["order"]["number"] == order["number"]
    catalog["d3"].refresh_from_db()
    assert catalog["d3"].stock == 8

    bad = auth_client.post("/api/v1/payments/verify/", {
        "razorpay_order_id": pay["gateway_order_id"], "razorpay_payment_id": "pay_1",
        "razorpay_signature": "bad"})
    assert bad.status_code == 400
    with django_capture_on_commit_callbacks(execute=True):
        ok = auth_client.post("/api/v1/payments/verify/", {
            "razorpay_order_id": pay["gateway_order_id"], "razorpay_payment_id": "pay_1",
            "razorpay_signature": sign(pay["gateway_order_id"], "pay_1")})
    assert ok.status_code == 200 and ok.data["status"] == "paid"
    assert len(mail.outbox) == 1
    # repeat verify is harmless
    assert auth_client.post("/api/v1/payments/verify/", {
        "razorpay_order_id": pay["gateway_order_id"], "razorpay_payment_id": "pay_1",
        "razorpay_signature": sign(pay["gateway_order_id"], "pay_1")}).status_code == 200
    assert len(mail.outbox) == 1
    assert auth_client.get("/api/v1/orders/").data["count"] == 1
    assert auth_client.get(f"/api/v1/orders/{order['number']}/").data["items"][0]["quantity"] == 2
    assert auth_client.post(f"/api/v1/orders/{order['number']}/cancel/").status_code == 409


def test_checkout_errors(auth_client, catalog, address):
    assert auth_client.post("/api/v1/checkout/", {"address_id": address}).data["error"]["code"] == "empty_cart"
    fill_cart(auth_client, catalog)
    assert auth_client.post("/api/v1/checkout/", {"address_id": 9999}).status_code == 404
    Product.objects.filter(pk=catalog["d3"].pk).update(stock=1)
    r = auth_client.post("/api/v1/checkout/", {"address_id": address})
    assert r.status_code == 409 and r.data["error"]["code"] == "cart_changed"


def test_cancel_restocks_and_expiry(auth_client, catalog, address):
    fill_cart(auth_client, catalog)
    n = auth_client.post("/api/v1/checkout/", {"address_id": address}).data["order"]["number"]
    r = auth_client.post(f"/api/v1/orders/{n}/cancel/")
    assert r.status_code == 200 and r.data["status"] == "cancelled"
    catalog["d3"].refresh_from_db()
    assert catalog["d3"].stock == 10

    fill_cart(auth_client, catalog)
    n2 = auth_client.post("/api/v1/checkout/", {"address_id": address}).data["order"]["number"]
    Order.objects.filter(number=n2).update(expires_at=timezone.now() - timedelta(minutes=1))
    assert cancel_expired_orders_sync() == 1
    catalog["d3"].refresh_from_db()
    assert catalog["d3"].stock == 10


def test_pay_retry_reuses_payment(auth_client, catalog, address):
    fill_cart(auth_client, catalog)
    c = auth_client.post("/api/v1/checkout/", {"address_id": address}).data
    r = auth_client.post(f"/api/v1/orders/{c['order']['number']}/pay/")
    assert r.data["gateway_order_id"] == c["payment"]["gateway_order_id"]


def test_orders_isolated(auth_client, api_client, catalog, address, db):
    from rest_framework_simplejwt.tokens import RefreshToken

    from apps.accounts.models import User

    fill_cart(auth_client, catalog)
    n = auth_client.post("/api/v1/checkout/", {"address_id": address}).data["order"]["number"]
    other = User.objects.create_user("o@example.com", "Str0ng!Passw0rd")
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(other).access_token}")
    assert api_client.get(f"/api/v1/orders/{n}/").status_code == 404
    assert api_client.post(f"/api/v1/orders/{n}/cancel/").status_code == 404
    assert api_client.post("/api/v1/checkout/", {"address_id": address}).status_code == 404


def test_checkout_flag_off(auth_client, catalog, address):
    from apps.core.models import FeatureFlag

    FeatureFlag.objects.create(key="checkout_enabled", enabled=False)
    fill_cart(auth_client, catalog)
    assert auth_client.post("/api/v1/checkout/", {"address_id": address}).status_code == 503
