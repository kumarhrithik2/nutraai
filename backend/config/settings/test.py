"""Used by pytest. SQLite by default; set TEST_DB_ENGINE=mysql in CI to test against MySQL."""
import tempfile
from pathlib import Path

from .base import *  # noqa: F401,F403
from .base import REST_FRAMEWORK, build_databases, env

ENVIRONMENT = "test"
DEBUG = False
SECRET_KEY = "test-secret-key-test-secret-key-test-secret-key-0123456789"
ALLOWED_HOSTS = ["testserver", "localhost"]

DATABASES = build_databases(env("TEST_DB_ENGINE", default="sqlite"))
if DATABASES["default"]["ENGINE"].endswith("sqlite3"):
    DATABASES["default"]["NAME"] = ":memory:"

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
CELERY_TASK_ALWAYS_EAGER = True
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
MEDIA_ROOT = Path(tempfile.mkdtemp(prefix="nutraai-test-media-"))
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

PAYMENT_GATEWAY = "fake"
RAZORPAY_KEY_ID = "rzp_test_fake"
RAZORPAY_KEY_SECRET = "test-key-secret"
RAZORPAY_WEBHOOK_SECRET = "test-webhook-secret"

REFRESH_COOKIE_SECURE = False
API_DOCS_ENABLED = True
API_RERAISE_UNHANDLED = True
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
ADMIN_REQUIRE_2FA = False

REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {k: "1000/min" for k in REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]},
}
