from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class StockAdjustment(TimeStampedModel):
    class Reason(models.TextChoices):
        MANUAL = "manual", "Manual adjustment"
        RESTOCK = "restock", "Restock"
        CORRECTION = "correction", "Correction"
        DAMAGE = "damage", "Damage / loss"
        ORDER_RESERVED = "order_reserved", "Order reserved"
        ORDER_RESTOCKED = "order_restocked", "Order restocked"
        OTHER = "other", "Other"

    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE, related_name="stock_adjustments")
    adjusted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    delta = models.IntegerField(help_text="Positive to add stock, negative to remove.")
    previous_stock = models.PositiveIntegerField()
    new_stock = models.PositiveIntegerField()
    reason = models.CharField(max_length=32, choices=Reason.choices, default=Reason.MANUAL)
    note = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.product_id} {self.delta:+d}"


class StoreSettings(TimeStampedModel):
    store_name = models.CharField(max_length=160, default="NutraAI Labs")
    support_email = models.EmailField(blank=True, default="")
    support_phone = models.CharField(max_length=40, blank=True, default="")
    currency = models.CharField(max_length=3, default="INR")
    low_stock_threshold = models.PositiveIntegerField(default=5)
    cod_enabled = models.BooleanField(default=True)
    online_payments_enabled = models.BooleanField(default=False)
    order_notifications_email = models.EmailField(blank=True, default="")
    return_policy = models.TextField(blank=True, default="")
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    class Meta:
        verbose_name = "store settings"
        verbose_name_plural = "store settings"

    @classmethod
    def get_solo(cls):
        obj = cls.objects.order_by("pk").first()
        if obj is None:
            obj = cls.objects.create()
        return obj


class SupplementSubscription(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        CANCELLED = "cancelled", "Cancelled"

    class Frequency(models.TextChoices):
        MONTHLY = "monthly", "Monthly"
        BIMONTHLY = "bimonthly", "Every 2 months"
        QUARTERLY = "quarterly", "Quarterly"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="supplement_subscriptions"
    )
    product = models.ForeignKey(
        "catalog.Product", null=True, blank=True, on_delete=models.SET_NULL, related_name="supplement_subscriptions"
    )
    product_name = models.CharField(max_length=160, blank=True, default="")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    frequency = models.CharField(max_length=16, choices=Frequency.choices, default=Frequency.MONTHLY)
    quantity = models.PositiveIntegerField(default=1)
    next_delivery_date = models.DateField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    notes = models.CharField(max_length=300, blank=True, default="")

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.user_id}:{self.product_name or self.product_id} ({self.status})"
