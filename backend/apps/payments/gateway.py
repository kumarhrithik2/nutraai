"""Payment gateway abstraction. `razorpay` talks to the real API; `fake` is for local/test."""
from __future__ import annotations

import hashlib
import hmac
import logging
import uuid
from dataclasses import dataclass

import httpx
from django.conf import settings

from apps.core.exceptions import ApiError

logger = logging.getLogger(__name__)


@dataclass
class GatewayOrder:
    id: str
    amount_paise: int
    currency: str


def _hmac_hex(secret: str, message: bytes) -> str:
    return hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()


class BaseGateway:
    name = "base"

    @property
    def key_id(self) -> str:
        return settings.RAZORPAY_KEY_ID

    async def create_order(self, *, amount_paise: int, currency: str, receipt: str,
                           notes: dict) -> GatewayOrder:
        raise NotImplementedError

    def verify_payment_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        expected = _hmac_hex(settings.RAZORPAY_KEY_SECRET, f"{order_id}|{payment_id}".encode())
        return hmac.compare_digest(expected, signature or "")

    def verify_webhook_signature(self, body: bytes, signature: str) -> bool:
        expected = _hmac_hex(settings.RAZORPAY_WEBHOOK_SECRET, body)
        return hmac.compare_digest(expected, signature or "")


class RazorpayGateway(BaseGateway):
    name = "razorpay"

    async def create_order(self, *, amount_paise, currency, receipt, notes) -> GatewayOrder:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{settings.RAZORPAY_API_BASE}/orders",
                    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
                    json={"amount": amount_paise, "currency": currency, "receipt": receipt,
                          "notes": notes},
                )
            resp.raise_for_status()
            data = resp.json()
        except (httpx.HTTPError, ValueError):
            logger.exception("Razorpay order creation failed")
            raise ApiError("Payment service is unavailable. Please try again in a moment.",
                           code="payment_gateway_unavailable", status_code=502)
        return GatewayOrder(id=data["id"], amount_paise=data["amount"], currency=data["currency"])


class FakeGateway(BaseGateway):
    """Deterministic stand-in. Signatures use the same HMAC scheme, so tests exercise real code."""

    name = "fake"

    async def create_order(self, *, amount_paise, currency, receipt, notes) -> GatewayOrder:
        return GatewayOrder(id=f"order_fake_{uuid.uuid4().hex[:14]}", amount_paise=amount_paise,
                            currency=currency)


def get_gateway() -> BaseGateway:
    return RazorpayGateway() if settings.PAYMENT_GATEWAY == "razorpay" else FakeGateway()
