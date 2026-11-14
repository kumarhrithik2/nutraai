"""The refresh token lives in an HTTP-only cookie so JavaScript can never read it."""
from django.conf import settings
from rest_framework.response import Response

from apps.core.exceptions import ApiError


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        settings.REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        path=settings.REFRESH_COOKIE_PATH,
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        settings.REFRESH_COOKIE_NAME,
        path=settings.REFRESH_COOKIE_PATH,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
    )


def ensure_trusted_origin(request) -> None:
    """Cookie-authenticated endpoints (refresh/logout) only accept our own front end.

    Browsers always send `Origin` on cross-site POSTs, so this blocks CSRF against them.
    """
    origin = request.headers.get("Origin")
    if not origin:
        return  # non-browser client (curl, mobile app): no ambient cookies to abuse
    own_origin = f"{request.scheme}://{request.get_host()}"
    if origin not in settings.CORS_ALLOWED_ORIGINS and origin != own_origin:
        raise ApiError("Request origin is not allowed.", code="forbidden_origin", status_code=403)
