"""Public door of the assessments module."""
from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

from asgiref.sync import sync_to_async
from django.conf import settings
from django.db import transaction

from apps.core.exceptions import ApiError
from apps.core.services import audit
from apps.core.utils import request_meta
from apps.profiles import services as profile_services

from .models import Assessment
from .signals import assessment_submitted

CONSENT_KINDS = ("health_data", "disclaimer")


def compute_bmi(height_cm: int, weight_kg: Decimal) -> Decimal:
    metres = Decimal(height_cm) / Decimal(100)
    return (Decimal(weight_kg) / (metres * metres)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)


def age_band(age: int) -> str:
    if age < 30:
        return "18-29"
    if age < 40:
        return "30-39"
    if age < 50:
        return "40-49"
    if age < 60:
        return "50-59"
    return "60+"


def _json_safe(data: dict) -> dict:
    out = {}
    for key, value in data.items():
        out[key] = float(value) if isinstance(value, Decimal) else value
    return out


def _create_sync(user, answers: dict, bmi, band, versions, ip, user_agent) -> Assessment:
    with transaction.atomic():
        for kind in CONSENT_KINDS:
            profile_services.record_consent(user, kind, True, ip=ip, user_agent=user_agent)
        return Assessment.objects.create(
            user=user, answers=answers, bmi=bmi, age_band=band, consent_versions=versions
        )


async def submit_assessment(user, validated: dict, *, request=None) -> Assessment:
    data = dict(validated)
    if not data.pop("health_data_consent") or not data.pop("disclaimer_accepted"):
        raise ApiError("Consent is required.", code="consent_required", status_code=400)
    bmi = compute_bmi(data["height_cm"], data["weight_kg"])
    band = age_band(data["age"])
    versions = {k: settings.CONSENT_VERSIONS[k] for k in CONSENT_KINDS}
    ip, ua = request_meta(request)
    assessment = await sync_to_async(_create_sync)(
        user, _json_safe(data), bmi, band, versions, ip, ua
    )
    # never log answers: they are health data
    await audit("assessment.submitted", request=request, actor=user, target=assessment)
    await assessment_submitted.asend_robust(
        sender=Assessment, assessment=assessment, user=user
    )
    return assessment


def assessments_for(user):
    return Assessment.objects.filter(user=user)


async def get_assessment(user, assessment_id: int) -> Assessment:
    obj = await assessments_for(user).filter(pk=assessment_id).afirst()
    if obj is None:
        raise ApiError("Assessment not found.", code="not_found", status_code=404)
    return obj


async def get_latest_assessment(user) -> Assessment | None:
    return await assessments_for(user).afirst()


def erase_user_assessments(user) -> None:
    Assessment.objects.filter(user=user).delete()
