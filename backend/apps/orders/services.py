"""Public door of the orders module: cart, checkout, order lifecycle."""
from __future__ import annotations

import logging
import secrets
from datetime import timedelta
from decimal import Decimal

from asgiref.sync import sync_to_async
from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone

from apps.catalog import services as catalog_services
from apps.catalog.models import Product
from apps.core.exceptions import ApiError
from apps.core.services import audit, audit_sync, flag_enabled
from apps.profiles import services as profile_services

from .models import Cart, CartItem, Order, OrderEvent, OrderItem

logger = logging.getLogger(__name__)
MONEY = Decimal("0.01")


# ------------------------------------------------------------------------- pricing
def shipping_for(subtotal: Decimal) -> Decimal:
    if subtotal <= 0 or subtotal >= settings.FREE_SHIPPING_THRESHOLD:
        return Decimal("0.00")
    return settings.SHIPPING_FEE.quantize(MONEY)


def to_paise(amount: Decimal) -> int:
    return int((amount * 100).quantize(Decimal("1")))


# ---------------------------------------------------------------------------- cart
async def _get_cart(user) -> Cart:
    cart, _ = await Cart.objects.aget_or_create(user=user)
    return cart


async def get_cart_view(user) -> dict:
    """Everything the cart endpoint returns, built from fresh DB state."""
    cart = await _get_cart(user)
    items = [i async for i in CartItem.objects.filter(cart=cart).select_related("product__category")
             .prefetch_related("product__images")]
    subtotal = sum((i.product.price * i.quantity for i in items if i.product.is_active), Decimal("0"))
    shipping = shipping_for(subtotal)
    remaining = max(Decimal("0"), settings.FREE_SHIPPING_THRESHOLD - subtotal) if subtotal else None
    return {
        "items": items,
        "item_count": sum(i.quantity for i in items),
        "subtotal": subtotal.quantize(MONEY),
        "shipping_fee": shipping,
        "total": (subtotal + shipping).quantize(MONEY),
        "free_shipping_remaining": remaining.quantize(MONEY) if remaining is not None else None,
    }


async def _product_or_404(product_id: int) -> Product:
    found = await catalog_services.get_active_products_by_ids([product_id])
    if product_id not in found:
        raise ApiError("This product is not available.", code="product_unavailable", status_code=404)
    return found[product_id]


def _check_quantity(product: Product, quantity: int) -> None:
    if quantity > settings.CART_MAX_QUANTITY_PER_ITEM:
        raise ApiError(
            f"You can order at most {settings.CART_MAX_QUANTITY_PER_ITEM} of one product.",
            code="quantity_limit", status_code=400,
        )
    if quantity > product.stock:
        raise ApiError(
            f"Only {product.stock} left in stock." if product.stock else "Out of stock.",
            code="insufficient_stock", status_code=409,
        )


async def add_to_cart(user, product_id: int, quantity: int) -> dict:
    product = await _product_or_404(product_id)
    cart = await _get_cart(user)
    item = await CartItem.objects.filter(cart=cart, product_id=product_id).afirst()
    new_qty = (item.quantity if item else 0) + quantity
    _check_quantity(product, new_qty)
    if item is None:
        try:
            await CartItem.objects.acreate(cart=cart, product_id=product_id, quantity=new_qty)
        except IntegrityError:  # double-click race: the other request created it first
            await CartItem.objects.filter(cart=cart, product_id=product_id).aupdate(
                quantity=new_qty, updated_at=timezone.now())
    else:
        item.quantity = new_qty
        await item.asave(update_fields=["quantity", "updated_at"])
    return await get_cart_view(user)


async def set_cart_quantity(user, product_id: int, quantity: int) -> dict:
    cart = await _get_cart(user)
    item = await CartItem.objects.filter(cart=cart, product_id=product_id).afirst()
    if item is None:
        raise ApiError("That item is not in your cart.", code="not_found", status_code=404)
    product = await _product_or_404(product_id)
    _check_quantity(product, quantity)
    item.quantity = quantity
    await item.asave(update_fields=["quantity", "updated_at"])
    return await get_cart_view(user)


async def remove_from_cart(user, product_id: int) -> dict:
    cart = await _get_cart(user)
    await CartItem.objects.filter(cart=cart, product_id=product_id).adelete()
    return await get_cart_view(user)


async def clear_cart(user) -> None:
    await CartItem.objects.filter(cart__user=user).adelete()


def erase_user_cart(user) -> None:
    Cart.objects.filter(user=user).delete()


# ------------------------------------------------------------------------ checkout
def _new_number() -> str:
    return f"NA{timezone.localdate():%y%m%d}-{secrets.token_hex(3).upper()}"


def _add_event(order: Order, status: str, note: str = "") -> None:
    OrderEvent.objects.create(order=order, status=status, note=note)


def _checkout_sync(user, address, idempotency_key: str | None, notes: str,
                   payment_method: str = Order.PaymentMethod.ONLINE) -> tuple[Order, bool]:
    with transaction.atomic():
        if idempotency_key:
            existing = Order.objects.filter(user=user, idempotency_key=idempotency_key).first()
            if existing:
                return existing, False

        # Lock the cart row: two simultaneous checkouts by the same user are serialised.
        cart = Cart.objects.select_for_update().filter(user=user).first()
        items = list(CartItem.objects.filter(cart=cart)) if cart else []
        if not items:
            raise ApiError("Your cart is empty.", code="empty_cart", status_code=400)

        # Lock products in primary-key order so concurrent checkouts cannot deadlock.
        ids = sorted(i.product_id for i in items)
        products = {p.pk: p for p in
                    Product.objects.select_for_update().select_related("category").filter(pk__in=ids)
                    .order_by("pk")}
        problems = []
        for item in items:
            p = products.get(item.product_id)
            if p is None or not p.is_active or not p.category.is_active:
                problems.append({"product_id": item.product_id, "issue": "unavailable"})
            elif p.stock < item.quantity:
                problems.append({"product_id": p.pk, "slug": p.slug, "issue": "insufficient_stock",
                                 "available": p.stock})
        if problems:
            raise ApiError("Some items in your cart are no longer available in that quantity.",
                           code="cart_changed", status_code=409, details=problems)

        subtotal = sum((products[i.product_id].price * i.quantity for i in items), Decimal("0"))
        shipping = shipping_for(subtotal)
        is_cod = payment_method == Order.PaymentMethod.COD
        for attempt in range(5):
            try:
                with transaction.atomic():
                    order = Order.objects.create(
                        user=user, number=_new_number(), idempotency_key=idempotency_key or None,
                        payment_method=payment_method,
                        subtotal=subtotal.quantize(MONEY), shipping_fee=shipping,
                        total=(subtotal + shipping).quantize(MONEY),
                        contact_email=user.email, ship_full_name=address.full_name,
                        ship_phone=address.phone, ship_line1=address.line1, ship_line2=address.line2,
                        ship_city=address.city, ship_state=address.state, ship_pincode=address.pincode,
                        notes=notes,
                        expires_at=None if is_cod else timezone.now() + timedelta(
                            minutes=settings.ORDER_PAYMENT_TIMEOUT_MINUTES),
                    )
                break
            except IntegrityError:
                if idempotency_key and Order.objects.filter(
                        user=user, idempotency_key=idempotency_key).exists():
                    raise
                if attempt == 4:
                    raise  # number collision five times in a row: genuinely unexpected

        for item in items:
            p = products[item.product_id]
            prev_stock = p.stock
            OrderItem.objects.create(
                order=order, product=p, name=p.name, sku=p.sku, unit_price=p.price,
                quantity=item.quantity, line_total=(p.price * item.quantity).quantize(MONEY),
            )
            Product.objects.filter(pk=p.pk).update(stock=F("stock") - item.quantity)
            try:
                from apps.admin_portal.models import StockAdjustment
                StockAdjustment.objects.create(
                    product_id=p.pk, adjusted_by=None, delta=-item.quantity,
                    previous_stock=prev_stock, new_stock=max(0, prev_stock - item.quantity),
                    reason=StockAdjustment.Reason.ORDER_RESERVED,
                    note=f"Reserved for order {order.number}",
                )
            except Exception:
                pass
        CartItem.objects.filter(cart=cart).delete()
        _add_event(order, Order.Status.PENDING_PAYMENT,
                   "Order placed (Cash on Delivery)" if is_cod else "Order placed")
        return order, True


async def checkout(user, *, address_id: int, idempotency_key: str | None, notes: str,
                   payment_method: str = Order.PaymentMethod.ONLINE, request=None):
    """Reserve stock, create the order and open a payment. Returns (order, payment_info)."""
    from apps.payments import services as payment_services  # lazy: payments imports orders

    if not await flag_enabled("checkout_enabled"):
        raise ApiError("Checkout is temporarily unavailable.", code="checkout_disabled", status_code=503)
    address = await profile_services.get_address(user, address_id)
    try:
        order, created = await sync_to_async(_checkout_sync)(
            user, address, idempotency_key, notes, payment_method
        )
    except IntegrityError:  # same idempotency key raced: return the winner
        order = await Order.objects.aget(user=user, idempotency_key=idempotency_key)
        created = False
    if created:
        await audit("order.created", request=request, actor=user, target=order, total=str(order.total))
    order = await get_order(user, order.number)
    payment = None
    if order.status == Order.Status.PENDING_PAYMENT and order.payment_method != Order.PaymentMethod.COD:
        payment = await payment_services.initiate_payment(order)
    return order, payment


# ---------------------------------------------------------------------- order reads
def orders_for(user):
    return Order.objects.filter(user=user, hidden_by_customer=False).prefetch_related(
        "items__product__images",
        "events",
    )


async def get_order(user, number: str) -> Order:
    order = await orders_for(user).filter(number=number).afirst()
    if order is None:
        raise ApiError("Order not found.", code="not_found", status_code=404)
    return order


def _archive_order_sync(order_id: int, user_id: int) -> Order:
    with transaction.atomic():
        order = Order.objects.select_for_update().filter(pk=order_id, user_id=user_id).first()
        if order is None:
            raise ApiError("Order not found.", code="not_found", status_code=404)
        if order.hidden_by_customer:
            return order
        if order.status in {Order.Status.SHIPPED, Order.Status.DELIVERED}:
            message = (
                "Delivered orders cannot be deleted because the order is finalized."
                if order.status == Order.Status.DELIVERED
                else "Shipped orders cannot be deleted because fulfillment is in progress."
            )
            raise ApiError(message, code="cannot_delete_order", status_code=409)
        if order.status in {Order.Status.PAID, Order.Status.PROCESSING, Order.Status.REFUND_REQUIRED}:
            if order.status == Order.Status.PAID:
                message = "Paid orders cannot be deleted because payment has been completed."
            elif order.status == Order.Status.PROCESSING:
                message = "Orders being processed cannot be deleted."
            else:
                message = "Orders requiring refund review cannot be deleted."
            raise ApiError(message, code="cannot_delete_order", status_code=409)
        if order.status == Order.Status.PENDING_PAYMENT:
            raise ApiError(
                "Orders awaiting payment cannot be deleted. Cancel the order if you no longer need it.",
                code="cannot_delete_order",
                status_code=409,
            )
        if order.status != Order.Status.CANCELLED:
            raise ApiError("This order cannot be deleted.", code="cannot_delete_order", status_code=409)
        order.hidden_by_customer = True
        order.hidden_at = timezone.now()
        order.save(update_fields=["hidden_by_customer", "hidden_at", "updated_at"])
        _add_event(order, order.status, "Removed from your orders list")
        return order


async def archive_order_for_customer(user, number: str, *, request=None) -> None:
    order = await Order.objects.filter(user=user, number=number).afirst()
    if order is None:
        raise ApiError("Order not found.", code="not_found", status_code=404)
    await sync_to_async(_archive_order_sync)(order.pk, user.pk)
    await audit("order.hidden_by_customer", request=request, actor=user, target=order)


# --------------------------------------------------------------------- cancellation
def _restock(order: Order) -> None:
    for item in order.items.select_related("product").all():
        prev_stock = item.product.stock
        Product.objects.filter(pk=item.product_id).update(stock=F("stock") + item.quantity)
        try:
            from apps.admin_portal.models import StockAdjustment
            StockAdjustment.objects.create(
                product_id=item.product_id, adjusted_by=None, delta=item.quantity,
                previous_stock=prev_stock, new_stock=prev_stock + item.quantity,
                reason=StockAdjustment.Reason.ORDER_RESTOCKED,
                note=f"Restocked from order {order.number}",
            )
        except Exception:
            pass


def _cancel_sync(order_id: int, user_id: int | None, note: str) -> Order:
    with transaction.atomic():
        order = Order.objects.select_for_update().get(pk=order_id)
        if user_id is not None and order.user_id != user_id:
            raise ApiError("Order not found.", code="not_found", status_code=404)
        if order.status == Order.Status.CANCELLED:
            return order
        # COD orders remain pending/unpaid until delivery/collection but can be cancelled before fulfillment.
        cancellable = {Order.Status.PENDING_PAYMENT}
        if order.payment_method == Order.PaymentMethod.COD:
            cancellable |= {Order.Status.PROCESSING}
        if order.status not in cancellable:
            raise ApiError("This order cannot be cancelled here. Please contact support.",
                           code="cannot_cancel", status_code=409)
        _restock(order)
        order.status = Order.Status.CANCELLED
        order.cancelled_at = timezone.now()
        order.save(update_fields=["status", "cancelled_at", "updated_at"])
        _add_event(order, Order.Status.CANCELLED, note)
        return order


async def cancel_order(user, number: str, *, request=None) -> Order:
    order = await get_order(user, number)
    await sync_to_async(_cancel_sync)(order.pk, user.pk, "Cancelled by customer")
    await audit("order.cancelled", request=request, actor=user, target=order)
    return await get_order(user, number)


def cancel_expired_orders_sync() -> int:
    ids = list(Order.objects.filter(status=Order.Status.PENDING_PAYMENT, expires_at__lt=timezone.now())
               .values_list("pk", flat=True)[:500])
    cancelled = 0
    for pk in ids:
        try:
            order = _cancel_sync(pk, None, "Payment window expired")
            if order.status == Order.Status.CANCELLED:
                cancelled += 1
        except ApiError:
            continue  # paid in the meantime
    return cancelled


# ------------------------------------------------------------------------- payment
def mark_order_paid(order_id: int, *, note: str = "Payment received") -> Order:
    """Called by payments once a capture is confirmed. Safe to call repeatedly."""
    from .tasks import send_order_confirmation

    with transaction.atomic():
        order = Order.objects.select_for_update().get(pk=order_id)
        if order.status in (Order.Status.PAID, Order.Status.PROCESSING, Order.Status.SHIPPED,
                            Order.Status.DELIVERED, Order.Status.REFUND_REQUIRED):
            return order
        if order.status == Order.Status.CANCELLED:
            # Money arrived after the payment window closed: try to re-reserve the stock.
            items = list(order.items.select_related("product"))
            products = {p.pk: p for p in Product.objects.select_for_update()
                        .filter(pk__in=[i.product_id for i in items]).order_by("pk")}
            if all(products[i.product_id].stock >= i.quantity for i in items):
                for i in items:
                    prev_stock = products[i.product_id].stock
                    Product.objects.filter(pk=i.product_id).update(stock=F("stock") - i.quantity)
                    try:
                        from apps.admin_portal.models import StockAdjustment
                        StockAdjustment.objects.create(
                            product_id=i.product_id, adjusted_by=None, delta=-i.quantity,
                            previous_stock=prev_stock, new_stock=max(0, prev_stock - i.quantity),
                            reason=StockAdjustment.Reason.ORDER_RESERVED,
                            note=f"Re-reserved for paid-late order {order.number}",
                        )
                    except Exception:
                        pass
            else:
                order.status = Order.Status.REFUND_REQUIRED
                order.paid_at = timezone.now()
                order.save(update_fields=["status", "paid_at", "updated_at"])
                _add_event(order, order.status, "Paid after expiry and stock is gone: refund needed")
                audit_sync("order.refund_required", target=order)
                return order
        order.status = Order.Status.PAID
        order.paid_at = timezone.now()
        order.cancelled_at = None
        order.save(update_fields=["status", "paid_at", "cancelled_at", "updated_at"])
        _add_event(order, Order.Status.PAID, note)
        audit_sync("order.paid", target=order, actor=order.user)
        def _send_confirmation():
            if settings.CELERY_TASK_ALWAYS_EAGER:
                send_order_confirmation.apply(args=[order.pk])
            else:
                send_order_confirmation.delay(order.pk)
        transaction.on_commit(_send_confirmation)
        return order
