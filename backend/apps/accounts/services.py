"""Public door of the accounts module."""
from __future__ import annotations

import logging

from asgiref.sync import sync_to_async
from django.contrib.auth import aauthenticate
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.exceptions import ApiError
from apps.core.services import audit, audit_sync, flag_enabled
from apps.core.utils import request_meta
from apps.profiles import services as profile_services

from .models import User

logger = logging.getLogger(__name__)

EMAIL_TAKEN = {"email": ["An account with this email already exists."]}


# ------------------------------------------------------------------------ tokens
def _issue_tokens_sync(user: User) -> tuple[str, str]:
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token), str(refresh)


async def issue_tokens(user: User) -> tuple[str, str]:
    """(access, refresh). Creating the refresh token writes a row, so it runs in a thread."""
    return await sync_to_async(_issue_tokens_sync)(user)


def _rotate_refresh_sync(refresh_token: str) -> tuple[str, str]:
    serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    return data["access"], data["refresh"]


async def rotate_refresh_token(refresh_token: str) -> tuple[str, str]:
    """Swap a valid refresh token for a new pair; the old one is blacklisted."""
    try:
        return await sync_to_async(_rotate_refresh_sync)(refresh_token)
    except (TokenError, AuthenticationFailed, User.DoesNotExist) as exc:
        raise ApiError(
            "Your session has expired. Please log in again.",
            code="invalid_refresh_token",
            status_code=401,
        ) from exc


def _blacklist_sync(refresh_token: str) -> None:
    try:
        RefreshToken(refresh_token).blacklist()
    except TokenError:
        pass  # already expired/blacklisted: nothing to do


async def revoke_refresh_token(refresh_token: str) -> None:
    await sync_to_async(_blacklist_sync)(refresh_token)


def _revoke_all_sync(user_id: int) -> None:
    for token in OutstandingToken.objects.filter(user_id=user_id):
        BlacklistedToken.objects.get_or_create(token=token)


# ------------------------------------------------------------------ registration
def _create_user_sync(email: str, password: str, full_name: str, ip, user_agent) -> User:
    with transaction.atomic():
        user = User.objects.create_user(email, password)
        profile_services.create_profile(user, full_name=full_name)
        profile_services.record_consent(
            user, "terms_privacy", True, ip=ip, user_agent=user_agent
        )
    return user


async def register_user(*, email: str, password: str, full_name: str, request) -> User:
    if not await flag_enabled("registration_open"):
        raise ApiError(
            "Registration is temporarily closed.", code="registration_closed", status_code=503
        )
    if await User.objects.filter(email__iexact=email).aexists():
        raise ValidationError(EMAIL_TAKEN)
    ip, user_agent = request_meta(request)
    try:
        user = await sync_to_async(_create_user_sync)(email, password, full_name, ip, user_agent)
    except IntegrityError:  # two sign-ups with the same email at the same instant
        raise ValidationError(EMAIL_TAKEN)
    await audit("auth.register", request=request, actor=user)
    return user


# -------------------------------------------------------------------------- login
async def login_user(*, email: str, password: str, request) -> User:
    user = await aauthenticate(request=None, email=email, password=password)
    if user is None:
        await audit("auth.login_failed", request=request, email=email)
        raise ApiError("Invalid email or password.", code="invalid_credentials", status_code=401)
    await User.objects.filter(pk=user.pk).aupdate(last_login=timezone.now())
    await audit("auth.login", request=request, actor=user)
    return user


async def get_user_with_profile(user_id: int) -> User:
    return await User.objects.select_related("profile").aget(pk=user_id)


# ------------------------------------------------------------ account management
async def verify_password_or_fail(user: User, password: str) -> None:
    if not await user.acheck_password(password):
        raise ValidationError({"password": ["Incorrect password."]})


def _set_password_sync(user: User, new_password: str) -> None:
    user.set_password(new_password)
    user.save(update_fields=["password"])
    _revoke_all_sync(user.pk)  # sign out everywhere else


async def change_password(user: User, *, current_password: str, new_password: str, request):
    if not await user.acheck_password(current_password):
        raise ValidationError({"current_password": ["Incorrect password."]})
    from .serializers import check_password_strength

    try:
        check_password_strength(new_password, user.email)
    except ValidationError as exc:
        raise ValidationError({"new_password": exc.detail["password"]})
    await sync_to_async(_set_password_sync)(user, new_password)
    await audit("auth.password_changed", request=request, actor=user)


async def change_email(user: User, *, new_email: str, password: str, request) -> User:
    await verify_password_or_fail(user, password)
    if await User.objects.filter(email__iexact=new_email).exclude(pk=user.pk).aexists():
        raise ValidationError({"new_email": EMAIL_TAKEN["email"]})
    old = user.email
    user.email = new_email
    try:
        await user.asave(update_fields=["email"])
    except IntegrityError:
        raise ValidationError({"new_email": EMAIL_TAKEN["email"]})
    await audit("auth.email_changed", request=request, actor=user, old_email=old)
    return user


def _delete_account_sync(user: User) -> None:
    """Right to erasure (DPDP Act): remove personal data, keep legally required order rows."""
    from apps.assessments import services as assessment_services
    from apps.orders import services as order_services

    with transaction.atomic():
        assessment_services.erase_user_assessments(user)
        order_services.erase_user_cart(user)
        profile_services.erase_user_profile(user)
        _revoke_all_sync(user.pk)
        user.email = f"deleted-{user.pk}@deleted.invalid"
        user.is_active = False
        user.is_staff = False
        user.set_unusable_password()
        user.save(update_fields=["email", "is_active", "is_staff", "password"])
    audit_sync("auth.account_deleted", actor=None, target=user)


async def delete_account(user: User, *, password: str, request) -> None:
    await verify_password_or_fail(user, password)
    await sync_to_async(_delete_account_sync)(user)
