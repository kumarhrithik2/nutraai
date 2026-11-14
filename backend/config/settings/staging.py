"""Staging: production hardening, but with Razorpay *test* keys, fake data and API docs on."""
from .base import env
from .production import *  # noqa: F401,F403

ENVIRONMENT = "staging"
API_DOCS_ENABLED = env.bool("API_DOCS_ENABLED", default=True)
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=3600)
