"""Production. Everything secret must come from environment variables."""
from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403
from .base import ALLOWED_HOSTS, PAYMENT_GATEWAY, SECRET_KEY, env

ENVIRONMENT = "production"
DEBUG = False

if len(SECRET_KEY) < 50:
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set (50+ random characters).")
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS must be set.")
if PAYMENT_GATEWAY != "razorpay":
    raise ImproperlyConfigured("PAYMENT_GATEWAY must be 'razorpay' outside local/test.")
for _name in ("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"):
    if not env(_name, default=""):
        raise ImproperlyConfigured(f"{_name} must be set.")

# HTTPS: DigitalOcean App Platform terminates TLS and forwards X-Forwarded-Proto.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
SECURE_REDIRECT_EXEMPT = [r"^api/v1/health/$"]  # platform health checks use plain HTTP
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = False
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
X_FRAME_OPTIONS = "DENY"
REFRESH_COOKIE_SECURE = True

# One proxy (App Platform) sits in front of the app.
REST_FRAMEWORK = {**REST_FRAMEWORK, "NUM_PROXIES": env.int("NUM_PROXIES", default=1)}  # noqa: F405

# Django Admin requires a TOTP second factor (create a device under Admin > TOTP devices).
ADMIN_REQUIRE_2FA = env.bool("ADMIN_REQUIRE_2FA", default=True)
ADMIN_URL = env("ADMIN_URL", default="admin/")  # set something unguessable in production

CELERY_TASK_ALWAYS_EAGER = False
