"""Public door of the core module: audit logging and feature flags."""
from __future__ import annotations

import logging

from django.conf import settings
from django.core.cache import cache

from .models import AuditLog, FeatureFlag
from .utils import request_meta

logger = logging.getLogger(__name__)

FLAG_CACHE_SECONDS = 60


def _build_entry(action, *, request=None, actor=None, target=None, **metadata) -> AuditLog:
    if actor is None and request is not None:
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            actor = user
    ip, user_agent = request_meta(request)
    return AuditLog(
        actor=actor if getattr(actor, "pk", None) else None,
        action=action,
        target_type=target._meta.label_lower if target is not None else "",
        target_id=str(target.pk) if target is not None else "",
        metadata=metadata,
        ip_address=ip,
        user_agent=user_agent,
    )


def audit_sync(action: str, **kwargs) -> None:
    """Write an audit row from synchronous code. Never raises."""
    try:
        _build_entry(action, **kwargs).save()
    except Exception:  # an audit failure must not break the user's request
        logger.exception("Could not write audit log for %s", action)


async def audit(action: str, **kwargs) -> None:
    """Write an audit row from async code. Never raises."""
    try:
        await _build_entry(action, **kwargs).asave()
    except Exception:
        logger.exception("Could not write audit log for %s", action)


async def flag_enabled(key: str) -> bool:
    """Is a feature flag on? DB row wins; otherwise FEATURE_FLAG_DEFAULTS. Cached 60s."""
    cache_key = f"flag:{key}"
    value = await cache.aget(cache_key)
    if value is None:
        row = await FeatureFlag.objects.filter(key=key).values_list("enabled", flat=True).afirst()
        value = settings.FEATURE_FLAG_DEFAULTS.get(key, False) if row is None else row
        await cache.aset(cache_key, value, FLAG_CACHE_SECONDS)
    return bool(value)
