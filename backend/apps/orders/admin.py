from django.contrib import admin

from .models import Order, OrderEvent, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    readonly_fields = ("product", "name", "sku", "unit_price", "quantity", "line_total")

    def has_add_permission(self, request, obj=None):
        return False


class OrderEventInline(admin.TabularInline):
    model = OrderEvent
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("number", "user", "status", "total", "created_at", "paid_at")
    list_filter = ("status", "created_at")
    search_fields = ("number", "user__email", "ship_full_name", "ship_phone")
    date_hierarchy = "created_at"
    list_select_related = ("user",)
    inlines = [OrderItemInline, OrderEventInline]
    readonly_fields = [
        "user", "number", "status", "subtotal", "shipping_fee", "total", "currency", "contact_email",
        "ship_full_name", "ship_phone", "ship_line1", "ship_line2", "ship_city", "ship_state",
        "ship_pincode", "notes", "expires_at", "paid_at", "cancelled_at", "created_at", "updated_at",
    ]
    fields = ["number", "user", "status", "tracking_note", *readonly_fields[3:]]
    actions = ["mark_processing", "mark_shipped", "mark_delivered"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def _bulk(self, request, queryset, new_status, allowed_from):
        n = 0
        for order in queryset.filter(status__in=allowed_from):
            order.status = new_status
            order.save(update_fields=["status", "updated_at"])
            OrderEvent.objects.create(order=order, status=new_status, note="Updated by staff")
            n += 1
        self.message_user(request, f"{n} order(s) updated.")

    @admin.action(description="Mark as processing")
    def mark_processing(self, request, queryset):
        self._bulk(request, queryset, Order.Status.PROCESSING, [Order.Status.PAID])

    @admin.action(description="Mark as shipped")
    def mark_shipped(self, request, queryset):
        self._bulk(request, queryset, Order.Status.SHIPPED, [Order.Status.PAID, Order.Status.PROCESSING])

    @admin.action(description="Mark as delivered")
    def mark_delivered(self, request, queryset):
        self._bulk(request, queryset, Order.Status.DELIVERED, [Order.Status.SHIPPED])
