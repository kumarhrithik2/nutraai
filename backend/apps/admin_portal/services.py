from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from asgiref.sync import sync_to_async
from django.db import transaction
from django.db.models import Count, F, Q, Sum
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone

from apps.accounts.models import User
from apps.assessments.models import Assessment
from apps.catalog.models import Product
from apps.core.exceptions import ApiError
from apps.core.models import AuditLog
from apps.core.services import audit_sync
from apps.customer.models import Membership
from apps.orders.models import Order, OrderEvent, OrderItem
from apps.orders import services as order_services
from apps.payments.models import Payment
from apps.profiles.models import Profile

from .models import StockAdjustment, StoreSettings, SupplementSubscription

MONEY = Decimal("0.01")
ORDER_STATUS_TRANSITIONS = {
    Order.Status.PENDING_PAYMENT: {Order.Status.CANCELLED},
    Order.Status.PAID: {Order.Status.PROCESSING, Order.Status.CANCELLED, Order.Status.REFUND_REQUIRED},
    Order.Status.PROCESSING: {Order.Status.SHIPPED, Order.Status.CANCELLED, Order.Status.REFUND_REQUIRED},
    Order.Status.SHIPPED: {Order.Status.DELIVERED, Order.Status.REFUND_REQUIRED},
    Order.Status.DELIVERED: {Order.Status.REFUND_REQUIRED},
    Order.Status.CANCELLED: set(),
    Order.Status.REFUND_REQUIRED: set(),
}


def _settings():
    return StoreSettings.get_solo()


# ------------------------------------------------------------------------- overview
def overview_data():
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    settings = _settings()
    threshold = settings.low_stock_threshold
    customers = User.objects.filter(role=User.Role.CUSTOMER).count()
    active_products = Product.objects.filter(is_active=True).count()
    orders_qs = Order.objects.all()
    total_orders = orders_qs.count()
    revenue = orders_qs.filter(status__in=[Order.Status.PAID, Order.Status.PROCESSING, Order.Status.SHIPPED, Order.Status.DELIVERED]).aggregate(s=Sum("total"))["s"] or Decimal("0")
    cod_collected = orders_qs.filter(payment_method=Order.PaymentMethod.COD, paid_at__isnull=False).aggregate(s=Sum("total"))["s"] or Decimal("0")
    subscriptions = Membership.objects.exclude(plan=Membership.Plan.FREE).filter(status="active").count() + SupplementSubscription.objects.filter(status=SupplementSubscription.Status.ACTIVE).count()
    recent_orders = list(
        Order.objects.select_related("user", "user__profile").prefetch_related("items").order_by("-created_at")[:8]
    )
    low_stock = list(Product.objects.filter(is_active=True, stock__lte=threshold).select_related("category").order_by("stock", "name")[:10])
    recent_activity = list(AuditLog.objects.select_related("actor").order_by("-created_at")[:12])

    # charts: orders/revenue last 14 days
    since = (now - timedelta(days=13)).date()
    daily = (
        Order.objects.filter(created_at__date__gte=since)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(
            orders=Count("id"),
            revenue=Sum("total", filter=Q(status__in=[Order.Status.PAID, Order.Status.PROCESSING, Order.Status.SHIPPED, Order.Status.DELIVERED])),
        )
        .order_by("day")
    )
    daily_map = {str(r["day"]): r for r in daily}
    daily_series = []
    for i in range(14):
        d = since + timedelta(days=i)
        key = str(d)
        r = daily_map.get(key, {})
        daily_series.append({"date": key, "orders": r.get("orders", 0) or 0, "revenue": str(r.get("revenue") or 0)})

    status_breakdown = list(Order.objects.values("status").annotate(count=Count("id")).order_by("status"))
    return {
        "kpis": {
            "total_customers": customers,
            "total_products": Product.objects.count(),
            "active_products": active_products,
            "total_orders": total_orders,
            "revenue": str(revenue.quantize(MONEY)),
            "cod_collected_revenue": str(cod_collected.quantize(MONEY)),
            "subscriptions": subscriptions,
            "low_stock_count": Product.objects.filter(is_active=True, stock__lte=threshold, stock__gt=0).count(),
            "out_of_stock_count": Product.objects.filter(is_active=True, stock=0).count(),
            "pending_orders": Order.objects.filter(status=Order.Status.PENDING_PAYMENT).count(),
        },
        "low_stock_threshold": threshold,
        "recent_orders": recent_orders,
        "low_stock_products": low_stock,
        "recent_activity": recent_activity,
        "charts": {
            "daily": daily_series,
            "status_breakdown": [{"status": s["status"], "count": s["count"]} for s in status_breakdown],
        },
        "generated_at": now,
    }


# ------------------------------------------------------------------------- inventory
def inventory_queryset():
    settings = _settings()
    threshold = settings.low_stock_threshold
    return Product.objects.select_related("category").prefetch_related("images", "stock_adjustments").all(), threshold


def adjust_stock_sync(*, product_id: int, delta: int, reason: str, note: str, actor):
    with transaction.atomic():
        product = Product.objects.select_for_update().filter(pk=product_id).first()
        if product is None:
            raise ApiError("Product not found.", code="not_found", status_code=404)
        try:
            delta = int(delta)
        except (TypeError, ValueError):
            raise ApiError("Delta must be an integer.", code="invalid_delta", status_code=400)
        if delta == 0:
            raise ApiError("Stock change cannot be zero.", code="invalid_delta", status_code=400)
        previous = product.stock
        new_stock = previous + delta
        if new_stock < 0:
            raise ApiError("Resulting stock cannot be negative.", code="negative_stock", status_code=400)
        if reason not in dict(StockAdjustment.Reason.choices):
            reason = StockAdjustment.Reason.MANUAL
        Product.objects.filter(pk=product.pk).update(stock=new_stock, updated_at=timezone.now())
        adj = StockAdjustment.objects.create(
            product=product,
            adjusted_by=actor if getattr(actor, "pk", None) else None,
            delta=delta,
            previous_stock=previous,
            new_stock=new_stock,
            reason=reason,
            note=(note or "")[:300],
        )
        audit_sync("inventory.adjusted", actor=actor, target=product, delta=delta, previous=previous, new=new_stock, reason=reason)
        product.stock = new_stock
        return product, adj


def record_order_stock_event(*, product, delta: int, previous: int, new: int, reason: str, note: str = "", actor=None):
    try:
        StockAdjustment.objects.create(
            product=product,
            adjusted_by=actor if getattr(actor, "pk", None) else None,
            delta=delta,
            previous_stock=max(0, previous),
            new_stock=max(0, new),
            reason=reason,
            note=(note or "")[:300],
        )
    except Exception:
        pass


# ------------------------------------------------------------------------- orders admin
def admin_orders_queryset():
    return Order.objects.select_related("user", "user__profile").prefetch_related("items", "events", "payments")


def admin_get_order(number: str):
    order = admin_orders_queryset().filter(number=number).first()
    if order is None:
        raise ApiError("Order not found.", code="not_found", status_code=404)
    return order


def allowed_transitions(order: Order):
    allowed = set(ORDER_STATUS_TRANSITIONS.get(order.status, set()))
    # COD collection: pending/processing/shipped/delivered COD orders that are not paid can be marked paid via collect action
    return sorted(allowed)


def update_order_status_sync(*, number: str, new_status: str, note: str = "", tracking_note: str | None = None, actor=None):
    if new_status not in dict(Order.Status.choices):
        raise ApiError("Invalid status.", code="invalid_status", status_code=400)
    with transaction.atomic():
        order = Order.objects.select_for_update().prefetch_related("items", "events").filter(number=number).first()
        if order is None:
            raise ApiError("Order not found.", code="not_found", status_code=404)
        if order.status == new_status:
            if tracking_note is not None:
                order.tracking_note = tracking_note
                order.save(update_fields=["tracking_note", "updated_at"])
            return order
        if new_status == Order.Status.CANCELLED:
            return _admin_cancel_sync(order, actor=actor, note=note or "Cancelled by admin")
        if new_status == Order.Status.REFUND_REQUIRED:
            # mark refund required; if stock not already restocked and order not cancelled, restock on cancellation-like refund? keep simple: record state and event
            order.status = Order.Status.REFUND_REQUIRED
            order.save(update_fields=["status", "updated_at"])
            OrderEvent.objects.create(order=order, status=Order.Status.REFUND_REQUIRED, note=(note or "Refund required")[:200])
            audit_sync("order.refund_required", actor=actor, target=order)
            if tracking_note is not None:
                order.tracking_note = tracking_note
                order.save(update_fields=["tracking_note", "updated_at"])
            return order
        allowed = ORDER_STATUS_TRANSITIONS.get(order.status, set())
        if new_status not in allowed:
            raise ApiError(f"Cannot change status from {order.status} to {new_status}.", code="invalid_transition", status_code=409)
        if new_status == Order.Status.PAID:
            # only via verified online payment flow normally; admin can confirm COD collection separately
            raise ApiError("Use collect-cod action for COD or verified payment flow for online orders.", code="use_collect_action", status_code=409)
        order.status = new_status
        fields = ["status", "updated_at"]
        if tracking_note is not None:
            order.tracking_note = tracking_note
            fields.append("tracking_note")
        order.save(update_fields=fields)
        OrderEvent.objects.create(order=order, status=new_status, note=(note or f"Status updated to {new_status}")[:200])
        audit_sync("order.status_changed", actor=actor, target=order, status=new_status)
        return order


def collect_cod_payment_sync(*, number: str, note: str = "", actor=None):
    with transaction.atomic():
        order = Order.objects.select_for_update().filter(number=number).first()
        if order is None:
            raise ApiError("Order not found.", code="not_found", status_code=404)
        if order.payment_method != Order.PaymentMethod.COD:
            raise ApiError("This action applies only to Cash on Delivery orders.", code="not_cod", status_code=409)
        if order.paid_at is not None or order.status in {Order.Status.PAID, Order.Status.PROCESSING, Order.Status.SHIPPED, Order.Status.DELIVERED} and order.paid_at is not None:
            return order
        if order.status == Order.Status.CANCELLED:
            raise ApiError("Cancelled orders cannot be collected.", code="cannot_collect", status_code=409)
        # mark collected/paid; keep fulfillment status progression sensible
        prev_status = order.status
        order.paid_at = timezone.now()
        if order.status == Order.Status.PENDING_PAYMENT:
            order.status = Order.Status.PROCESSING
        # if already processing/shipped/delivered (shouldn't happen without paid_at in our flow, but be safe) keep status
        order.save(update_fields=["paid_at", "status", "updated_at"])
        OrderEvent.objects.create(order=order, status=order.status, note=(note or "Cash on Delivery payment collected")[:200])
        audit_sync("order.cod_collected", actor=actor, target=order, previous_status=prev_status)
        return order


def _admin_cancel_sync(order: Order, *, actor=None, note: str = "Cancelled by admin"):
    if order.status == Order.Status.CANCELLED:
        return order
    cancellable = {Order.Status.PENDING_PAYMENT, Order.Status.PAID, Order.Status.PROCESSING}
    # COD can be cancelled before delivery; shipped/delivered require refund flow
    if order.status not in cancellable:
        raise ApiError("This order cannot be cancelled in its current state.", code="cannot_cancel", status_code=409)
    # restock reserved items
    for item in order.items.select_related("product").all():
        prev = item.product.stock
        Product.objects.filter(pk=item.product_id).update(stock=F("stock") + item.quantity)
        try:
            new_stock = Product.objects.filter(pk=item.product_id).values_list("stock", flat=True).first() or (prev + item.quantity)
            record_order_stock_event(product=item.product, delta=item.quantity, previous=prev, new=new_stock, reason=StockAdjustment.Reason.ORDER_RESTOCKED, note=f"Restocked on cancellation of order {order.number}", actor=actor)
        except Exception:
            pass
    order.status = Order.Status.CANCELLED
    order.cancelled_at = timezone.now()
    order.save(update_fields=["status", "cancelled_at", "updated_at"])
    OrderEvent.objects.create(order=order, status=Order.Status.CANCELLED, note=note[:200])
    audit_sync("order.cancelled_admin", actor=actor, target=order)
    return order


def admin_cancel_order_sync(*, number: str, note: str = "", actor=None):
    with transaction.atomic():
        order = Order.objects.select_for_update().prefetch_related("items").filter(number=number).first()
        if order is None:
            raise ApiError("Order not found.", code="not_found", status_code=404)
        return _admin_cancel_sync(order, actor=actor, note=note or "Cancelled by admin")


# ------------------------------------------------------------------------- customers
def admin_customers_queryset():
    return (
        User.objects.filter(role=User.Role.CUSTOMER)
        .select_related("profile", "membership")
        .annotate(order_count=Count("orders", distinct=True), total_spent=Sum("orders__total", filter=Q(orders__status__in=[Order.Status.PAID, Order.Status.PROCESSING, Order.Status.SHIPPED, Order.Status.DELIVERED])))
        .order_by("-date_joined")
    )


def admin_get_customer(user_id: int):
    user = (
        User.objects.filter(role=User.Role.CUSTOMER)
        .select_related("profile", "membership", "preferences")
        .annotate(order_count=Count("orders", distinct=True), total_spent=Sum("orders__total"))
        .filter(pk=user_id)
        .first()
    )
    if user is None:
        raise ApiError("Customer not found.", code="not_found", status_code=404)
    return user


# ------------------------------------------------------------------------- subscriptions
def admin_memberships_queryset():
    return Membership.objects.select_related("user", "user__profile").order_by("-updated_at")


def admin_supplement_subscriptions_queryset():
    return SupplementSubscription.objects.select_related("user", "user__profile", "product").order_by("-created_at")


# ------------------------------------------------------------------------- analytics
def analytics_data(*, date_from=None, date_to=None):
    orders = Order.objects.all()
    users = User.objects.filter(role=User.Role.CUSTOMER)
    if date_from:
        orders = orders.filter(created_at__date__gte=date_from)
    if date_to:
        orders = orders.filter(created_at__date__lte=date_to)
    paid_statuses = [Order.Status.PAID, Order.Status.PROCESSING, Order.Status.SHIPPED, Order.Status.DELIVERED]
    revenue = orders.filter(status__in=paid_statuses).aggregate(s=Sum("total"))["s"] or Decimal("0")
    cod_collected = orders.filter(payment_method=Order.PaymentMethod.COD, paid_at__isnull=False).aggregate(s=Sum("total"))["s"] or Decimal("0")
    orders_count = orders.count()
    avg_order = (revenue / orders.filter(status__in=paid_statuses).count()) if orders.filter(status__in=paid_statuses).count() else Decimal("0")

    # customer growth by month (all time windowed by filter if provided on created?)
    cust_qs = users
    if date_from:
        cust_qs = cust_qs.filter(date_joined__date__gte=date_from)
    if date_to:
        cust_qs = cust_qs.filter(date_joined__date__lte=date_to)
    customer_growth = list(
        cust_qs.annotate(month=TruncMonth("date_joined")).values("month").annotate(count=Count("id")).order_by("month")
    )

    revenue_by_month = list(
        orders.filter(status__in=paid_statuses).annotate(month=TruncMonth("created_at")).values("month").annotate(revenue=Sum("total"), orders=Count("id")).order_by("month")
    )

    top_products = list(
        OrderItem.objects.filter(order__in=orders.filter(status__in=paid_statuses)).values("product_id", "name", "sku").annotate(quantity=Sum("quantity"), revenue=Sum("line_total"), orders=Count("order_id", distinct=True)).order_by("-revenue")[:10]
    )

    status_breakdown = list(orders.values("status").annotate(count=Count("id"), revenue=Sum("total")).order_by("status"))
    payment_breakdown = list(orders.values("payment_method").annotate(count=Count("id"), revenue=Sum("total")).order_by("payment_method"))

    settings = _settings()
    threshold = settings.low_stock_threshold
    inventory = {
        "total_products": Product.objects.count(),
        "active_products": Product.objects.filter(is_active=True).count(),
        "low_stock": Product.objects.filter(is_active=True, stock__gt=0, stock__lte=threshold).count(),
        "out_of_stock": Product.objects.filter(is_active=True, stock=0).count(),
        "total_units": Product.objects.aggregate(s=Sum("stock"))["s"] or 0,
    }

    memberships = list(Membership.objects.values("plan", "status").annotate(count=Count("id")).order_by("plan", "status"))
    supplement_subs = list(SupplementSubscription.objects.values("status").annotate(count=Count("id")).order_by("status"))

    return {
        "summary": {
            "revenue": str(revenue.quantize(MONEY)),
            "cod_collected_revenue": str(cod_collected.quantize(MONEY)),
            "orders": orders_count,
            "paid_orders": orders.filter(status__in=paid_statuses).count(),
            "average_order_value": str(avg_order.quantize(MONEY)),
            "customers": User.objects.filter(role=User.Role.CUSTOMER).count(),
            "new_customers": cust_qs.count(),
        },
        "revenue_by_month": [{"month": str(x["month"].date()) if x["month"] else None, "revenue": str(x["revenue"] or 0), "orders": x["orders"]} for x in revenue_by_month],
        "customer_growth": [{"month": str(x["month"].date()) if x["month"] else None, "count": x["count"]} for x in customer_growth],
        "top_products": [{"product_id": x["product_id"], "name": x["name"], "sku": x["sku"], "quantity": x["quantity"] or 0, "revenue": str(x["revenue"] or 0), "orders": x["orders"]} for x in top_products],
        "order_status_breakdown": [{"status": x["status"], "count": x["count"], "revenue": str(x["revenue"] or 0)} for x in status_breakdown],
        "payment_breakdown": [{"payment_method": x["payment_method"], "count": x["count"], "revenue": str(x["revenue"] or 0)} for x in payment_breakdown],
        "inventory": inventory,
        "subscriptions": {"memberships": memberships, "supplement_subscriptions": supplement_subs},
        "filters": {"date_from": str(date_from) if date_from else None, "date_to": str(date_to) if date_to else None},
    }
