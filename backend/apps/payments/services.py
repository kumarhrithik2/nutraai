"""Public door of the payments module."""
from __future__ import annotations

import json
import logging

from asgiref.sync import sync_to_async
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.core.exceptions import ApiError
from apps.core.services import audit, audit_sync
from apps.orders import services as order_services
from apps.orders.models import Order

from .gateway import get_gateway
from .models import Payment, WebhookEvent

logger = logging.getLogger(__name__)


async def initiate_payment(order: Order) -> dict:
    """Return what the browser needs to open the checkout widget. Reuses an open payment."""
    if order.status != Order.Status.PENDING_PAYMENT:
        raise ApiError("This order is not awaiting payment.", code="order_not_payable", status_code=409)
    if getattr(order, "payment_method", "online") == "cod":
        raise ApiError("Cash on Delivery orders do not require online payment.",
                       code="cod_no_online_payment", status_code=409)
    gateway = get_gateway()
    amount = order_services.to_paise(order.total)
    payment = await Payment.objects.filter(
        order=order, status=Payment.Status.CREATED, amount_paise=amount, gateway=gateway.name
    ).afirst()
    if payment is None:
        created = await gateway.create_order(
            amount_paise=amount, currency=order.currency, receipt=order.number,
            notes={"order_number": order.number},
        )
        payment = await Payment.objects.acreate(
            order=order, gateway=gateway.name, gateway_order_id=created.id,
            amount_paise=amount, currency=order.currency,
        )
    return {"gateway": gateway.name, "key_id": gateway.key_id,
            "gateway_order_id": payment.gateway_order_id, "amount": payment.amount_paise,
            "currency": payment.currency}


def _capture_sync(gateway_order_id: str, gateway_payment_id: str, amount_paise: int | None,
                  user_id: int | None) -> Order:
    with transaction.atomic():
        payment = Payment.objects.select_for_update().select_related("order").filter(
            gateway_order_id=gateway_order_id).first()
        if payment is None or (user_id is not None and payment.order.user_id != user_id):
            raise ApiError("Payment not found.", code="not_found", status_code=404)
        if amount_paise is not None and amount_paise != payment.amount_paise:
            audit_sync("payment.amount_mismatch", target=payment)
            raise ApiError("Payment amount does not match the order.", code="amount_mismatch",
                           status_code=400)
        if payment.status != Payment.Status.CAPTURED:
            other = Payment.objects.filter(gateway_payment_id=gateway_payment_id).exclude(pk=payment.pk)
            if other.exists():
                raise ApiError("This payment was already used.", code="payment_reused", status_code=409)
            payment.status = Payment.Status.CAPTURED
            payment.gateway_payment_id = gateway_payment_id
            payment.failure_reason = ""
            payment.save(update_fields=["status", "gateway_payment_id", "failure_reason", "updated_at"])
        return order_services.mark_order_paid(payment.order_id)


async def verify_payment(user, *, gateway_order_id: str, gateway_payment_id: str,
                         signature: str, request=None) -> Order:
    """Browser callback after checkout. The HMAC proves Razorpay (not the client) vouches for it."""
    if not get_gateway().verify_payment_signature(gateway_order_id, gateway_payment_id, signature):
        await audit("payment.bad_signature", request=request, actor=user)
        raise ApiError("Payment verification failed.", code="invalid_signature", status_code=400)
    order = await sync_to_async(_capture_sync)(gateway_order_id, gateway_payment_id, None, user.pk)
    return await order_services.get_order(user, order.number)


def _fail_sync(gateway_order_id: str, reason: str) -> None:
    Payment.objects.filter(gateway_order_id=gateway_order_id, status=Payment.Status.CREATED).update(
        status=Payment.Status.FAILED, failure_reason=reason[:200], updated_at=timezone.now())


def _process_event_sync(event: WebhookEvent) -> None:
    payload = event.payload
    entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    order_entity = payload.get("payload", {}).get("order", {}).get("entity", {})
    gateway_order_id = entity.get("order_id") or order_entity.get("id")
    if event.event_type in ("payment.captured", "order.paid") and gateway_order_id:
        payment_id = entity.get("id")
        if payment_id:
            _capture_sync(gateway_order_id, payment_id, entity.get("amount"), None)
    elif event.event_type == "payment.failed" and gateway_order_id:
        _fail_sync(gateway_order_id, entity.get("error_description") or "Payment failed")


def _handle_webhook_sync(event_id: str, payload: dict) -> str:
    try:
        with transaction.atomic():  # savepoint: a duplicate key must not poison an outer transaction
            event = WebhookEvent.objects.create(
                event_id=event_id, event_type=payload.get("event", "")[:60], payload=payload)
    except IntegrityError:
        existing = WebhookEvent.objects.get(event_id=event_id)
        if existing.processed_at:
            return "duplicate"
        event = existing  # earlier attempt failed: process again
    try:
        _process_event_sync(event)
    except ApiError as exc:
        event.error = str(exc.detail)[:300]
        event.processed_at = timezone.now()  # business rejection: retrying will not help
        event.save(update_fields=["error", "processed_at"])
        return "rejected"
    event.processed_at = timezone.now()
    event.error = ""
    event.save(update_fields=["processed_at", "error"])
    return "processed"


async def handle_webhook(raw_body: bytes, signature: str, event_id: str) -> str:
    if not get_gateway().verify_webhook_signature(raw_body, signature):
        raise ApiError("Invalid signature.", code="invalid_signature", status_code=400)
    try:
        payload = json.loads(raw_body)
        if not isinstance(payload, dict):
            raise ValueError
    except ValueError:
        raise ApiError("Malformed payload.", code="bad_payload", status_code=400)
    if not event_id:
        raise ApiError("Missing event id.", code="bad_payload", status_code=400)
    return await sync_to_async(_handle_webhook_sync)(event_id, payload)
