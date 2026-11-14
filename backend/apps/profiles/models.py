from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


def avatar_upload_path(instance, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    return f"avatars/{instance.user_id}.{ext}"


class Profile(TimeStampedModel):
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"
        UNDISCLOSED = "undisclosed", "Prefer not to say"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=12, choices=Gender.choices, blank=True)
    avatar = models.ImageField(upload_to=avatar_upload_path, blank=True)

    def __str__(self):
        return self.full_name or f"profile {self.user_id}"


class ConsentRecord(models.Model):
    """Append-only consent ledger (DPDP). The latest row per kind is the current state."""

    KINDS = [(k, k.replace("_", " ").title()) for k in settings.CONSENT_VERSIONS]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="consents"
    )
    kind = models.CharField(max_length=32, choices=KINDS)
    version = models.CharField(max_length=16)
    accepted = models.BooleanField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [models.Index(fields=["user", "kind", "-created_at"])]

    def __str__(self):
        return f"{self.user_id}:{self.kind}@{self.version}={self.accepted}"


class Address(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="addresses"
    )
    label = models.CharField(max_length=40, blank=True)
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=15)
    line1 = models.CharField(max_length=200)
    line2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=80)
    state = models.CharField(max_length=40)
    pincode = models.CharField(max_length=6)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_default", "-updated_at"]
        verbose_name_plural = "addresses"

    def __str__(self):
        return f"{self.full_name}, {self.city} {self.pincode}"
