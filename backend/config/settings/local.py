"""Local development on your laptop. Fake payments, console email, tasks run inline."""
from .base import *  # noqa: F401,F403
from .base import ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, SECRET_KEY, env

ENVIRONMENT = "local"
DEBUG = True
SECRET_KEY = SECRET_KEY or "local-only-insecure-secret-key-change-me-0123456789abcdef"
ALLOWED_HOSTS = ALLOWED_HOSTS or ["localhost", "127.0.0.1", "[::1]", "testserver"]
CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS or [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

REFRESH_COOKIE_SECURE = False  # plain http://localhost
API_DOCS_ENABLED = True
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=True)
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
PAYMENT_GATEWAY = env("PAYMENT_GATEWAY", default="fake")
