import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@shared_task(name="orders.send_order_confirmation", autoretry_for=(OSError,), retry_backoff=True,
             max_retries=5)
def send_order_confirmation(order_id: int) -> None:
    from .models import Order

    order = Order.objects.prefetch_related("items").filter(pk=order_id).first()
    if order is None:
        return
    lines = "\n".join(f"- {i.name} x {i.quantity}: INR {i.line_total}" for i in order.items.all())
    body = (
        f"Hi {order.ship_full_name},\n\nThank you for your order {order.number}.\n\n{lines}\n\n"
        f"Shipping: INR {order.shipping_fee}\nTotal paid: INR {order.total}\n\n"
        f"We will ship to: {order.ship_line1}, {order.ship_city}, {order.ship_state} {order.ship_pincode}.\n\n"
        "NutraAI Labs"
    )
    send_mail(f"Order {order.number} confirmed", body, settings.DEFAULT_FROM_EMAIL,
              [order.contact_email], fail_silently=False)


@shared_task(name="orders.cancel_expired_orders")
def cancel_expired_orders() -> int:
    from .services import cancel_expired_orders_sync

    count = cancel_expired_orders_sync()
    if count:
        logger.info("Cancelled %s expired orders", count)
    return count
