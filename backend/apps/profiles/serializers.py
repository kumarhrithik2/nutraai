import re
from datetime import date

from django.conf import settings
from rest_framework import serializers

from .models import Address, Profile

INDIAN_STATES = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
    "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
]
_STATE_LOOKUP = {s.lower(): s for s in INDIAN_STATES}
_PHONE_RE = re.compile(r"^(?:\+91|91|0)?([6-9]\d{9})$")
_PINCODE_RE = re.compile(r"^[1-9]\d{5}$")


def normalize_phone(value: str) -> str:
    cleaned = re.sub(r"[\s\-()]", "", value or "")
    match = _PHONE_RE.match(cleaned)
    if not match:
        raise serializers.ValidationError("Enter a valid 10-digit Indian mobile number.")
    return match.group(1)


class PhoneField(serializers.CharField):
    def to_internal_value(self, data):
        return normalize_phone(super().to_internal_value(data))


class ProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Profile
        fields = ["full_name", "email", "phone", "date_of_birth", "gender", "avatar_url"]
        read_only_fields = ["email", "avatar_url"]

    def get_avatar_url(self, obj) -> str | None:
        if not obj.avatar:
            return None
        url = obj.avatar.url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request and url.startswith("/") else url


class ProfileUpdateSerializer(serializers.Serializer):
    """DB-free validation; the view applies it with aupdate_instance()."""

    full_name = serializers.CharField(max_length=120, required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(choices=Profile.Gender.choices, required=False, allow_blank=True)

    def validate_full_name(self, value):
        value = " ".join(value.split())
        if len(value) < 2:
            raise serializers.ValidationError("Enter your full name.")
        return value

    def validate_phone(self, value):
        return normalize_phone(value) if value else ""

    def validate_date_of_birth(self, value):
        if value is None:
            return value
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if value > today or age > 120:
            raise serializers.ValidationError("Enter a valid date of birth.")
        if age < 18:
            raise serializers.ValidationError("You must be at least 18 years old.")
        return value


class AvatarUploadSerializer(serializers.Serializer):
    avatar = serializers.ImageField()

    def validate_avatar(self, value):
        if value.size > settings.AVATAR_MAX_BYTES:
            mb = settings.AVATAR_MAX_BYTES // (1024 * 1024)
            raise serializers.ValidationError(f"Image must be {mb} MB or smaller.")
        if getattr(value, "content_type", "") not in {"image/jpeg", "image/png", "image/webp"}:
            raise serializers.ValidationError("Only JPEG, PNG or WebP images are allowed.")
        return value


class ConsentInputSerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=list(settings.CONSENT_VERSIONS))
    accepted = serializers.BooleanField()

    def validate(self, attrs):
        if attrs["kind"] == "terms_privacy" and not attrs["accepted"]:
            raise serializers.ValidationError(
                {"accepted": "Terms are required to keep an account; delete the account instead."}
            )
        return attrs


class ConsentStateSerializer(serializers.Serializer):
    kind = serializers.CharField()
    accepted = serializers.BooleanField()
    version = serializers.CharField(allow_null=True)
    current_version = serializers.CharField()
    up_to_date = serializers.BooleanField()
    recorded_at = serializers.DateTimeField(allow_null=True)


class AddressSerializer(serializers.ModelSerializer):
    phone = PhoneField(max_length=20)

    class Meta:
        model = Address
        fields = ["id", "label", "full_name", "phone", "line1", "line2", "city", "state",
                  "pincode", "is_default"]
        read_only_fields = ["id"]
        # DB-free: avoid ModelSerializer auto validators touching the database
        validators = []

    def validate_state(self, value):
        state = _STATE_LOOKUP.get(value.strip().lower())
        if not state:
            raise serializers.ValidationError("Select a valid Indian state or union territory.")
        return state

    def validate_pincode(self, value):
        value = value.strip()
        if not _PINCODE_RE.match(value):
            raise serializers.ValidationError("Enter a valid 6-digit PIN code.")
        return value

    def validate_full_name(self, value):
        return " ".join(value.split())


class AddressPatchSerializer(AddressSerializer):
    def __init__(self, *args, **kwargs):
        kwargs["partial"] = True
        super().__init__(*args, **kwargs)


class OptionsSerializer(serializers.Serializer):
    genders = serializers.ListField(child=serializers.DictField())
    states = serializers.ListField(child=serializers.CharField())
    consent_versions = serializers.DictField(child=serializers.CharField())
