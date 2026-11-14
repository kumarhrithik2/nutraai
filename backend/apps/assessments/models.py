from django.conf import settings
from django.db import models


class Assessment(models.Model):
    """One submitted questionnaire. Immutable: a new submission is a new row."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assessments"
    )
    answers = models.JSONField()
    bmi = models.DecimalField(max_digits=5, decimal_places=1)
    age_band = models.CharField(max_length=8)
    consent_versions = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self):
        return f"Assessment {self.pk} (user {self.user_id})"
