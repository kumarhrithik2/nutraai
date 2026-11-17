from __future__ import annotations

from datetime import timedelta

from asgiref.sync import sync_to_async
from django.utils import timezone

from apps.core.exceptions import ApiError

from .models import Membership, Notification, ProgressEntry, UserPreferences


async def get_or_create_membership(user):
    obj, _ = await Membership.objects.aget_or_create(user=user)
    return obj


async def select_plan(user, plan: str):
    if plan not in {Membership.Plan.FREE, Membership.Plan.MONTHLY, Membership.Plan.YEARLY}:
        raise ApiError("Invalid plan.", code="invalid_plan", status_code=400)
    obj, _ = await Membership.objects.aget_or_create(user=user)
    obj.plan = plan
    obj.status = "active"
    if plan == Membership.Plan.MONTHLY:
        obj.renewed_at = timezone.now() + timedelta(days=30)
    elif plan == Membership.Plan.YEARLY:
        obj.renewed_at = timezone.now() + timedelta(days=365)
    else:
        obj.renewed_at = None
    await obj.asave()
    return obj


async def list_progress(user, days: int = 30):
    since = timezone.now() - timedelta(days=max(1, min(days, 365)))
    return [e async for e in ProgressEntry.objects.filter(user=user, created_at__gte=since)]


async def log_progress(user, data: dict):
    return await ProgressEntry.objects.acreate(user=user, **data)


async def list_notifications(user):
    return [n async for n in Notification.objects.filter(user=user)]


async def unread_count(user) -> int:
    return await Notification.objects.filter(user=user, read=False).acount()


async def mark_read(user, notif_id: int):
    n = await Notification.objects.filter(user=user, pk=notif_id).afirst()
    if n and not n.read:
        n.read = True
        await n.asave(update_fields=["read"])
    return n


async def mark_all_read(user):
    await Notification.objects.filter(user=user, read=False).aupdate(read=True)


async def get_preferences(user):
    obj, _ = await UserPreferences.objects.aget_or_create(user=user)
    return obj


async def update_preferences(user, data: dict):
    obj, _ = await UserPreferences.objects.aget_or_create(user=user)
    for k, v in data.items():
        setattr(obj, k, v)
    await obj.asave()
    return obj
