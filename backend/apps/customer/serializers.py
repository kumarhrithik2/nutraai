from rest_framework import serializers

from .models import Membership, Notification, UserPreferences


class MembershipSerializer(serializers.ModelSerializer):
    renewedAt = serializers.DateTimeField(source="renewed_at", allow_null=True)

    class Meta:
        model = Membership
        fields = ["plan", "status", "renewedAt"]


class SelectPlanSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(choices=["free", "monthly", "yearly"])


class NotificationSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField()

    class Meta:
        model = Notification
        fields = ["id", "title", "body", "read", "created_at"]


class PreferencesSerializer(serializers.ModelSerializer):
    language = serializers.ChoiceField(choices=[code for code, _ in UserPreferences.LANGUAGE_CHOICES])
    email_updates = serializers.BooleanField()
    in_app_notifications = serializers.BooleanField()

    class Meta:
        model = UserPreferences
        fields = ["language", "email_updates", "in_app_notifications"]
