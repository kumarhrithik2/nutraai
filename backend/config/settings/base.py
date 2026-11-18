"""Settings shared by every environment. Environment files import * from here."""
from datetime import timedelta
from decimal import Decimal
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
if (BASE_DIR / ".env").exists():
    environ.Env.read_env(BASE_DIR / ".env")

ENVIRONMENT = "base"
SECRET_KEY = env("DJANGO_SECRET_KEY", default="")
DEBUG = False
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])

# --------------------------------------------------------------------------- apps
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third party
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "drf_spectacular",
    "corsheaders",
    "django_otp",
    "django_otp.plugins.otp_totp",
    # project modules (each owns its own tables, talks to others via services.py)
    "apps.core",
    "apps.accounts",
    "apps.profiles",
    "apps.assessments",
    "apps.catalog",
    "apps.orders",
    "apps.payments",
    "apps.recommendations",
    "apps.customer",
    "apps.admin_portal",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django_otp.middleware.OTPMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

AUTH_USER_MODEL = "accounts.User"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ------------------------------------------------------------------------ database
def build_databases(engine: str) -> dict:
    """MySQL 8 is the real target; SQLite exists for quick local runs and tests."""
    if engine == "sqlite":
        return {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": env("SQLITE_PATH", default=str(BASE_DIR / "db.sqlite3")),
            }
        }
    return {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": env("DB_NAME", default="nutraai"),
            "USER": env("DB_USER", default="nutraai"),
            "PASSWORD": env("DB_PASSWORD", default=""),
            "HOST": env("DB_HOST", default="127.0.0.1"),
            "PORT": env("DB_PORT", default="3306"),
            # Persistent connections are not safe under ASGI: always open per request.
            "CONN_MAX_AGE": 0,
            "ATOMIC_REQUESTS": False,
            "OPTIONS": {
                "charset": "utf8mb4",
                "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
                **({"ssl": {"ca": env("DB_SSL_CA")}} if env("DB_SSL_CA", default="") else {}),
            },
        }
    }


# DATABASES = build_databases(env("DB_ENGINE", default="mysql"))
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# --------------------------------------------------------------------------- cache
REDIS_URL = env("REDIS_URL", default="")
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
            "KEY_PREFIX": "nutraai",
        }
    }
else:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

# -------------------------------------------------------------------- auth / users
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env.int("ACCESS_TOKEN_MINUTES", default=15)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env.int("REFRESH_TOKEN_DAYS", default=14)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "ALGORITHM": "HS256",
}

REFRESH_COOKIE_NAME = "nutraai_refresh"
REFRESH_COOKIE_PATH = "/api/v1/auth/"
REFRESH_COOKIE_SECURE = True
REFRESH_COOKIE_SAMESITE = env("REFRESH_COOKIE_SAMESITE", default="Lax")

# --------------------------------------------------------------------- DRF / docs
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework_simplejwt.authentication.JWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.core.exceptions.api_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "120/min",
        "user": "300/min",
        "auth": "10/min",
        "register": "5/min",
        "refresh": "60/min",
        "assessment": "10/hour",
        "checkout": "20/hour",
        "upload": "20/hour",
    },
    # Number of reverse proxies in front of Django (DigitalOcean App Platform = 1).
    "NUM_PROXIES": env.int("NUM_PROXIES", default=0),
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "NutraAI Labs API",
    "DESCRIPTION": (
        "Backend API for NutraAI Labs. Access tokens go in `Authorization: Bearer <token>`; "
        "the refresh token lives in an HTTP-only cookie managed by `/auth/*`."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": r"/api/v1",
}
API_DOCS_ENABLED = env.bool("API_DOCS_ENABLED", default=False)
API_RERAISE_UNHANDLED = False

# ------------------------------------------------------------------ CORS / CSRF
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",
    "content-type",
    "idempotency-key",
    "x-requested-with",
]
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

# ------------------------------------------------------------------ static / media
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = Path(env("MEDIA_ROOT", default=str(BASE_DIR / "media")))

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
}

# DigitalOcean Spaces (S3 compatible) for product images and avatars.
SPACES_BUCKET = env("SPACES_BUCKET", default="")
if SPACES_BUCKET:
    STORAGES["default"] = {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "bucket_name": SPACES_BUCKET,
            "endpoint_url": env("SPACES_ENDPOINT_URL"),
            "access_key": env("SPACES_ACCESS_KEY"),
            "secret_key": env("SPACES_SECRET_KEY"),
            "region_name": env("SPACES_REGION", default="blr1"),
            "custom_domain": env("SPACES_CDN_DOMAIN", default=None),
            "default_acl": "public-read",
            "querystring_auth": False,
            "file_overwrite": False,
        },
    }

# ----------------------------------------------------------------- i18n / time
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = False
USE_TZ = True

# ------------------------------------------------------------------ celery / mail
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default=REDIS_URL or "memory://")
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=False)
CELERY_TASK_IGNORE_RESULT = True
CELERY_TASK_SOFT_TIME_LIMIT = 60
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_BEAT_SCHEDULE = {
    "cancel-expired-orders": {"task": "orders.cancel_expired_orders", "schedule": 300.0},
}

EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="NutraAI Labs <no-reply@nutraai.example>")

# -------------------------------------------------------------- business settings
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173")
ADMIN_URL = env("ADMIN_URL", default="admin/")
ADMIN_REQUIRE_2FA = False
OTP_TOTP_ISSUER = "NutraAI Labs"

# Versions of the legal text the user agreed to. Bump when the text changes: users then
# show up as "outdated" in GET /consents/ and can be asked to agree again.
CONSENT_VERSIONS = {
    "terms_privacy": "1.0",
    "health_data": "1.0",
    "disclaimer": "1.0",
    "marketing": "1.0",
}
AVATAR_MAX_BYTES = 5 * 1024 * 1024
MAX_ADDRESSES_PER_USER = 10

CART_MAX_QUANTITY_PER_ITEM = 10
SHIPPING_FEE = Decimal(env("SHIPPING_FEE", default="49"))
FREE_SHIPPING_THRESHOLD = Decimal(env("FREE_SHIPPING_THRESHOLD", default="499"))
ORDER_PAYMENT_TIMEOUT_MINUTES = env.int("ORDER_PAYMENT_TIMEOUT_MINUTES", default=30)

# "razorpay" calls the real API. "fake" never touches the network (local/tests only).
PAYMENT_GATEWAY = env("PAYMENT_GATEWAY", default="fake")
RAZORPAY_KEY_ID = env("RAZORPAY_KEY_ID", default="rzp_test_fake")
RAZORPAY_KEY_SECRET = env("RAZORPAY_KEY_SECRET", default="fake-key-secret")
RAZORPAY_WEBHOOK_SECRET = env("RAZORPAY_WEBHOOK_SECRET", default="fake-webhook-secret")
RAZORPAY_API_BASE = "https://api.razorpay.com/v1"

# Feature flags: DB rows (Django Admin > Feature flags) override these defaults.
FEATURE_FLAG_DEFAULTS = {
    "registration_open": True,
    "checkout_enabled": True,
    "ai_suggestions": False,  # switched on when the recommendation module ships
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"simple": {"format": "%(asctime)s %(levelname)s %(name)s: %(message)s"}},
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "simple"}},
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", default="INFO")},
}
