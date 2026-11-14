import hashlib
import hmac
import json

import pytest
from django.conf import settings

from apps.orders.models import Order
from apps.payments.models import Payment

pytestmark = pytest.mark.django_db
ADDR = {"full_name": "Asha Patil", "phone": "9876543210", "line1": "12 MG Road",
        "city": "Nashik", "state": "Maharashtra", "pincode": "422001"}


@pytest.fixture
def placed(auth_client, catalog):
    addr = auth_client.post("/api/v1/addresses/", ADDR).data["id"]
    auth_client.post("/api/v1/cart/items/", {"product_id": catalog["d3"].pk, "quantity": 1})
    return auth_client.post("/api/v1/checkout/", {"address_id": addr}).data


def post_event(client, body: dict, event_id="evt_1", secret=None):
    raw = json.dumps(body).encode()
    sig = hmac.new((secret or settings.RAZORPAY_WEBHOOK_SECRET).encode(), raw, hashlib.sha256).hexdigest()
    return client.post("/api/v1/payments/webhook/", data=raw, content_type="application/json",
                       HTTP_X_RAZORPAY_SIGNATURE=sig, HTTP_X_RAZORPAY_EVENT_ID=event_id)


def captured(placed, amount=None, pid="pay_w1"):
    return {"event": "payment.captured", "payload": {"payment": {"entity": {
        "id": pid, "order_id": placed["payment"]["gateway_order_id"],
        "amount": amount or placed["payment"]["amount"]}}}}


def test_bad_signature(api_client, placed):
    r = post_event(api_client, captured(placed), secret="wrong")
    assert r.status_code == 400
    assert Order.objects.get().status == "pending_payment"


def test_capture_and_replay(api_client, placed):
    assert post_event(api_client, captured(placed)).data["status"] == "processed"
    assert Order.objects.get().status == "paid"
    assert post_event(api_client, captured(placed)).data["status"] == "duplicate"
    # new event id for the same payment does not double-process
    assert post_event(api_client, captured(placed), event_id="evt_2").status_code == 200
    assert Payment.objects.get().status == "captured"


def test_amount_mismatch_rejected(api_client, placed):
    assert post_event(api_client, captured(placed, amount=100)).data["status"] == "rejected"
    assert Order.objects.get().status == "pending_payment"


def test_failed_payment(api_client, placed):
    body = {"event": "payment.failed", "payload": {"payment": {"entity": {
        "id": "pay_x", "order_id": placed["payment"]["gateway_order_id"],
        "error_description": "Card declined"}}}}
    assert post_event(api_client, body).status_code == 200
    assert Payment.objects.get().status == "failed"


def test_paid_after_expiry_restocks_or_refunds(api_client, placed, catalog):
    from apps.orders import services

    o = Order.objects.get()
    services._cancel_sync(o.pk, None, "expired")
    assert post_event(api_client, captured(placed)).status_code == 200
    assert Order.objects.get().status == "paid"
    catalog["d3"].refresh_from_db()
    assert catalog["d3"].stock == 9
