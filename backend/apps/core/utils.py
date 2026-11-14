from __future__ import annotations

from django.conf import settings


def get_client_ip(request) -> str | None:
    """Best-effort client IP that is not spoofable when NUM_PROXIES is set correctly."""
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    proxies = settings.REST_FRAMEWORK.get("NUM_PROXIES", 0)
    if forwarded and proxies:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if len(parts) >= proxies:
            return parts[-proxies]
    return request.META.get("REMOTE_ADDR") or None


def request_meta(request) -> tuple[str | None, str]:
    """(ip, user_agent) for audit and consent records. Safe to call with request=None."""
    if request is None:
        return None, ""
    return get_client_ip(request), request.META.get("HTTP_USER_AGENT", "")[:255]


async def aupdate_instance(instance, validated_data: dict, *, extra_fields=("updated_at",)):
    """Apply validated serializer data to a model instance with a native async save.

    `ModelSerializer.save()` is synchronous, so async views use this instead.
    """
    for field, value in validated_data.items():
        setattr(instance, field, value)
    await instance.asave(update_fields=[*validated_data.keys(), *extra_fields])
    return instance
