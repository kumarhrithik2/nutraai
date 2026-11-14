from django.contrib import admin

from .models import Payment, WebhookEvent


class ReadOnlyAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Payment)
class PaymentAdmin(ReadOnlyAdmin):
    list_display = ("gateway_order_id", "order", "status", "amount_paise", "gateway", "created_at")
    list_filter = ("status", "gateway")
    search_fields = ("gateway_order_id", "gateway_payment_id", "order__number")
    list_select_related = ("order",)


@admin.register(WebhookEvent)
class WebhookEventAdmin(ReadOnlyAdmin):
    list_display = ("event_id", "event_type", "processed_at", "error", "received_at")
    list_filter = ("event_type",)
