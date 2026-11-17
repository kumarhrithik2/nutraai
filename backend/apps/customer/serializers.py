from rest_framework import serializers

from .models import Membership, Notification, ProgressEntry, UserPreferences


class MembershipSerializer(serializers.ModelSerializer):
    renewedAt = serializers.DateTimeField(source="renewed_at", allow_null=True)

    class Meta:
        model = Membership
        fields = ["plan", "status", "renewedAt"]


class SelectPlanSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(choices=["free", "monthly", "yearly"])


class ProgressEntrySerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = ProgressEntry
        fields = ["id", "energy_level", "water_intake_l", "weight_kg", "took_supplements", "created_at"]


class ProgressCreateSerializer(serializers.Serializer):
    energy_level = serializers.IntegerField(min_value=1, max_value=5, required=False, allow_null=True)
    water_intake_l = serializers.DecimalField(max_digits=4, decimal_places=1, min_value=0, required=False, allow_null=True)
    weight_kg = serializers.DecimalField(max_digits=5, decimal_places=1, min_value=0, required=False, allow_null=True)
    took_supplements = serializers.BooleanField(required=False, allow_null=True)


class NotificationSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField()

    class Meta:
        model = Notification
        fields = ["id", "title", "body", "read", "created_at"]


class PreferencesSerializer(serializers.ModelSerializer):
    email_updates = serializers.BooleanField()
    reminders = serializers.BooleanField()
    reminder_time = serializers.TimeField(required=False, allow_null=True)
    reminder_channel = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = UserPreferences
        fields = ["email_updates", "reminders", "reminder_time", "reminder_channel"]
