from django.conf import settings
from django.db import models


class Membership(models.Model):
    class Plan(models.TextChoices):
        FREE = "free", "Free"
        MONTHLY = "monthly", "Monthly"
        YEARLY = "yearly", "Yearly"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="membership")
    plan = models.CharField(max_length=16, choices=Plan.choices, default=Plan.FREE)
    status = models.CharField(max_length=32, default="active")
    renewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user_id}:{self.plan}"


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=160)
    body = models.TextField(blank=True)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]


class UserPreferences(models.Model):
    LANGUAGE_CHOICES = [("en", "English")]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="preferences")
    language = models.CharField(max_length=8, choices=LANGUAGE_CHOICES, default="en")
    email_updates = models.BooleanField(default=False)
    in_app_notifications = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
