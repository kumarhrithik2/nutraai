from django.db import models

from apps.core.models import TimeStampedModel


class Payment(TimeStampedModel):
    class Status(models.TextChoices):
        CREATED = "created", "Created"
        CAPTURED = "captured", "Captured"
        FAILED = "failed", "Failed"

    order = models.ForeignKey("orders.Order", on_delete=models.PROTECT, related_name="payments")
    gateway = models.CharField(max_length=20)
    gateway_order_id = models.CharField(max_length=64, unique=True)
    gateway_payment_id = models.CharField(max_length=64, null=True, blank=True, unique=True)
    amount_paise = models.PositiveIntegerField()
    currency = models.CharField(max_length=3, default="INR")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.CREATED, db_index=True)
    failure_reason = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.gateway_order_id} ({self.status})"


class WebhookEvent(models.Model):
    """One row per gateway event id: replays are detected by the unique key."""

    event_id = models.CharField(max_length=80, unique=True)
    event_type = models.CharField(max_length=60)
    payload = models.JSONField()
    processed_at = models.DateTimeField(null=True, blank=True)
    error = models.CharField(max_length=300, blank=True)
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-received_at"]
