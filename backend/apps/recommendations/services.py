"""Public door for recommendations (computed from latest assessment)."""
from __future__ import annotations

from apps.assessments import services as assessment_services
from apps.core.exceptions import ApiError

from .pipeline import generate_for_assessment


async def get_latest(user):
    assessment = await assessment_services.get_latest_assessment(user)
    if assessment is None:
        raise ApiError("No assessment found. Complete an assessment first.", code="not_found", status_code=404)
    items = await generate_for_assessment(assessment)
    return {"id": assessment.pk, "assessment_id": assessment.pk, "created_at": assessment.created_at, "items": items}
