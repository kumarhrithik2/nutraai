"""Public door of the profiles module."""
from __future__ import annotations

from asgiref.sync import sync_to_async
from django.conf import settings
from django.db import transaction

from apps.core.exceptions import ApiError

from .models import Address, ConsentRecord, Profile


# ---------------------------------------------------------------------- profile
def create_profile(user, *, full_name: str) -> Profile:
    return Profile.objects.create(user=user, full_name=full_name)


async def aget_profile(user) -> Profile:
    return await Profile.objects.aget(user=user)


def erase_user_profile(user) -> None:
    """Remove personal data but keep the row (account shell stays for order integrity)."""
    Address.objects.filter(user=user).delete()
    profile = Profile.objects.filter(user=user).first()
    if profile:
        if profile.avatar:
            profile.avatar.delete(save=False)
        profile.full_name = "Deleted user"
        profile.phone = ""
        profile.date_of_birth = None
        profile.gender = ""
        profile.avatar = ""
        profile.save()


# --------------------------------------------------------------------- consents
def record_consent(user, kind: str, accepted: bool, *, ip=None, user_agent="") -> ConsentRecord:
    if kind not in settings.CONSENT_VERSIONS:
        raise ApiError("Unknown consent type.", code="invalid_consent", status_code=400)
    return ConsentRecord.objects.create(
        user=user,
        kind=kind,
        version=settings.CONSENT_VERSIONS[kind],
        accepted=accepted,
        ip_address=ip,
        user_agent=user_agent,
    )


async def arecord_consent(user, kind: str, accepted: bool, *, ip=None, user_agent="") -> ConsentRecord:
    if kind not in settings.CONSENT_VERSIONS:
        raise ApiError("Unknown consent type.", code="invalid_consent", status_code=400)
    return await ConsentRecord.objects.acreate(
        user=user,
        kind=kind,
        version=settings.CONSENT_VERSIONS[kind],
        accepted=accepted,
        ip_address=ip,
        user_agent=user_agent,
    )


async def current_consents(user) -> dict[str, dict]:
    """{kind: {accepted, version, current_version, up_to_date, recorded_at}} (latest row wins)."""
    state: dict[str, dict] = {}
    async for rec in ConsentRecord.objects.filter(user=user).order_by("-created_at", "-id"):
        if rec.kind in state:
            continue
        current = settings.CONSENT_VERSIONS.get(rec.kind)
        state[rec.kind] = {
            "kind": rec.kind,
            "accepted": rec.accepted,
            "version": rec.version,
            "current_version": current,
            "up_to_date": rec.accepted and rec.version == current,
            "recorded_at": rec.created_at,
        }
    for kind, version in settings.CONSENT_VERSIONS.items():
        state.setdefault(
            kind,
            {"kind": kind, "accepted": False, "version": None, "current_version": version,
             "up_to_date": False, "recorded_at": None},
        )
    return state


async def has_valid_consent(user, kind: str) -> bool:
    return (await current_consents(user))[kind]["up_to_date"]


# ---------------------------------------------------------------------- avatars
async def set_avatar(profile: Profile, upload) -> Profile:
    def _save():
        if profile.avatar:
            profile.avatar.delete(save=False)
        profile.avatar.save(upload.name, upload, save=False)
        profile.save(update_fields=["avatar", "updated_at"])

    await sync_to_async(_save)()
    return profile


async def remove_avatar(profile: Profile) -> None:
    def _rm():
        if profile.avatar:
            profile.avatar.delete(save=False)
        profile.avatar = ""
        profile.save(update_fields=["avatar", "updated_at"])

    await sync_to_async(_rm)()


# -------------------------------------------------------------------- addresses
def _create_address_sync(user, data: dict) -> Address:
    with transaction.atomic():
        # lock the user's addresses so the limit and default flag cannot race
        existing = list(Address.objects.select_for_update().filter(user=user))
        if len(existing) >= settings.MAX_ADDRESSES_PER_USER:
            raise ApiError(
                f"You can save up to {settings.MAX_ADDRESSES_PER_USER} addresses.",
                code="address_limit",
                status_code=400,
            )
        make_default = data.get("is_default") or not existing
        if make_default:
            Address.objects.filter(user=user, is_default=True).update(is_default=False)
        data = {**data, "is_default": bool(make_default)}
        return Address.objects.create(user=user, **data)


async def create_address(user, data: dict) -> Address:
    return await sync_to_async(_create_address_sync)(user, data)


def _update_address_sync(user, address_id: int, data: dict) -> Address:
    with transaction.atomic():
        address = Address.objects.select_for_update().filter(user=user, pk=address_id).first()
        if address is None:
            raise ApiError("Address not found.", code="not_found", status_code=404)
        if data.get("is_default"):
            Address.objects.filter(user=user, is_default=True).exclude(pk=address.pk).update(
                is_default=False
            )
        for field, value in data.items():
            setattr(address, field, value)
        address.save()
        return address


async def update_address(user, address_id: int, data: dict) -> Address:
    return await sync_to_async(_update_address_sync)(user, address_id, data)


def _delete_address_sync(user, address_id: int) -> None:
    with transaction.atomic():
        address = Address.objects.select_for_update().filter(user=user, pk=address_id).first()
        if address is None:
            raise ApiError("Address not found.", code="not_found", status_code=404)
        was_default = address.is_default
        address.delete()
        if was_default:
            nxt = Address.objects.filter(user=user).order_by("-updated_at").first()
            if nxt:
                Address.objects.filter(pk=nxt.pk).update(is_default=True)


async def delete_address(user, address_id: int) -> None:
    await sync_to_async(_delete_address_sync)(user, address_id)


async def get_address(user, address_id: int) -> Address:
    address = await Address.objects.filter(user=user, pk=address_id).afirst()
    if address is None:
        raise ApiError("Address not found.", code="not_found", status_code=404)
    return address
