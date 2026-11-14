"""Pure validation only: these serializers never touch the database (async-safe)."""
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import User


def check_password_strength(password: str, email: str = "") -> None:
    try:
        validate_password(password, user=User(email=email))
    except DjangoValidationError as exc:
        raise serializers.ValidationError({"password": list(exc.messages)})


class PasswordField(serializers.CharField):
    def __init__(self, **kwargs):
        kwargs.setdefault("max_length", 128)
        kwargs.setdefault("trim_whitespace", False)
        kwargs.setdefault("write_only", True)
        kwargs.setdefault("style", {"input_type": "password"})
        super().__init__(**kwargs)


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    email = serializers.EmailField(max_length=254)
    password = PasswordField(min_length=8)
    confirm_password = PasswordField(required=False)
    accept_terms = serializers.BooleanField(
        help_text="Must be true: Terms & Conditions and Privacy Policy."
    )

    def validate_email(self, value):
        return value.strip().lower()

    def validate_accept_terms(self, value):
        if not value:
            raise serializers.ValidationError(
                "Please accept the Terms & Conditions and Privacy Policy."
            )
        return value

    def validate(self, attrs):
        confirm = attrs.pop("confirm_password", None)
        if confirm is not None and confirm != attrs["password"]:
            raise serializers.ValidationError({"confirm_password": ["Passwords do not match."]})
        check_password_strength(attrs["password"], attrs["email"])
        return attrs


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = PasswordField()

    def validate_email(self, value):
        return value.strip().lower()


class ChangePasswordSerializer(serializers.Serializer):
    current_password = PasswordField()
    new_password = PasswordField(min_length=8)

    def validate(self, attrs):
        if attrs["current_password"] == attrs["new_password"]:
            raise serializers.ValidationError(
                {"new_password": ["The new password must be different from the current one."]}
            )
        return attrs


class ChangeEmailSerializer(serializers.Serializer):
    new_email = serializers.EmailField(max_length=254)
    password = PasswordField()

    def validate_new_email(self, value):
        return value.strip().lower()


class DeleteAccountSerializer(serializers.Serializer):
    password = PasswordField()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "role", "full_name", "date_joined"]
        read_only_fields = fields

    def get_full_name(self, obj) -> str:
        profile = getattr(obj, "profile", None)  # views always select_related("profile")
        return profile.full_name if profile else ""


class AuthResponseSerializer(serializers.Serializer):
    """Documentation-only shape of the login/register/refresh response."""

    access = serializers.CharField(help_text="Short-lived JWT, send as Bearer token.")
    user = UserSerializer()


class AccessTokenSerializer(serializers.Serializer):
    access = serializers.CharField()
