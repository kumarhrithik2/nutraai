from __future__ import annotations

from datetime import timedelta

from django.utils import timezone

from apps.core.exceptions import ApiError

from .models import Membership, Notification, UserPreferences


async def get_or_create_membership(user):
    obj, _ = await Membership.objects.aget_or_create(user=user)
    return obj


async def select_plan(user, plan: str):
    if plan not in {Membership.Plan.FREE, Membership.Plan.MONTHLY, Membership.Plan.YEARLY}:
        raise ApiError("Invalid plan.", code="invalid_plan", status_code=400)
    obj, _ = await Membership.objects.aget_or_create(user=user)
    obj.plan = plan
    obj.status = "active"
    if plan == Membership.Plan.MONTHLY:
        obj.renewed_at = timezone.now() + timedelta(days=30)
    elif plan == Membership.Plan.YEARLY:
        obj.renewed_at = timezone.now() + timedelta(days=365)
    else:
        obj.renewed_at = None
    await obj.asave()
    return obj


async def list_notifications(user):
    return [n async for n in Notification.objects.filter(user=user)]


async def unread_count(user) -> int:
    return await Notification.objects.filter(user=user, read=False).acount()


async def mark_read(user, notif_id: int):
    n = await Notification.objects.filter(user=user, pk=notif_id).afirst()
    if n and not n.read:
        n.read = True
        await n.asave(update_fields=["read"])
    return n


async def mark_all_read(user):
    await Notification.objects.filter(user=user, read=False).aupdate(read=True)


async def get_preferences(user):
    obj, _ = await UserPreferences.objects.aget_or_create(user=user)
    return obj


async def update_preferences(user, data: dict):
    obj, _ = await UserPreferences.objects.aget_or_create(user=user)
    for k, v in data.items():
        setattr(obj, k, v)
    await obj.asave()
    return obj


# ---------------------------------------------------------------------------
# AI wellness assistant
# ---------------------------------------------------------------------------
ASSISTANT_MAX_QUESTION = 1000

_GOAL_LABELS = {
    "energy": "energy", "immunity": "immunity", "sleep": "sleep", "stress": "stress",
    "bone_joint": "bone and joint health", "heart": "heart health",
    "hair_skin_nails": "hair, skin and nails", "muscle": "muscle", "digestion": "digestion",
}

_ASSISTANT_DISCLAIMER = (
    "This is general wellness information, not medical advice. "
    "Speak with a qualified healthcare professional about personal concerns."
)


def _build_assistant_answer(question: str, assessment) -> str:
    q = question.lower()
    goals = []
    answers = {}
    if assessment is not None:
        answers = getattr(assessment, "answers", None) or {}
        for g in answers.get("goals") or []:
            goals.append(_GOAL_LABELS.get(g, str(g).replace("_", " ")))

    parts = []
    if any(word in q for word in ("protein",)):
        parts.append(
            "Protein supports muscle repair and steady energy. Good options include lentils, beans, "
            "paneer, tofu, eggs, fish, dairy and nuts. Spreading intake across meals is usually easier "
            "than concentrating it in one sitting."
        )
    elif any(word in q for word in ("vitamin", "supplement", "b12", "b 12", "iron", "calcium", "zinc", "omega")):
        parts.append(
            "Supplements are most useful when they fill a genuine gap. Nutrient needs depend on your diet, "
            "sun exposure, age and any medical conditions, so review specific products with a qualified "
            "professional rather than starting several at once."
        )
    elif any(word in q for word in ("sleep", "tired", "fatigue", "insomnia")):
        parts.append(
            "Consistent sleep and wake times, a dark and cool room, and reducing late caffeine or screens "
            "often improve sleep quality. Persistent fatigue is worth discussing with a clinician."
        )
    elif any(word in q for word in ("stress", "anxiety", "mood", "relax")):
        parts.append(
            "Gentle daily movement, slow breathing, time outdoors and a regular routine can help with "
            "stress. If stress is persistent or affecting daily life, professional support is worthwhile."
        )
    elif any(word in q for word in ("exercise", "workout", "activity", "steps", "weight", "muscle")):
        parts.append(
            "Aim for activity you can sustain: a mix of walking, light strength work and mobility, "
            "building up gradually. Comfort and consistency matter more than intensity."
        )
    elif any(word in q for word in ("diet", "nutrition", "food", "meal", "eat", "hydration", "water")):
        parts.append(
            "A varied diet with vegetables, fruit, whole grains, a protein source and enough fluids covers "
            "most everyday needs. Small, repeatable changes tend to work better than restrictive plans."
        )
    else:
        parts.append(
            "A helpful starting point is a balanced routine: varied meals, regular movement, consistent "
            "sleep and enough fluids. Tell me which area you want to focus on and I can go deeper."
        )

    if goals:
        parts.append("Since you selected these goals, keep them in focus: " + ", ".join(sorted(set(goals))) + ".")

    sleep = answers.get("sleep_hours")
    if sleep is not None:
        try:
            if float(sleep) < 7:
                parts.append("Your latest assessment reported under 7 hours of sleep; a consistent bedtime routine may help.")
        except (TypeError, ValueError):
            pass

    parts.append(_ASSISTANT_DISCLAIMER)
    return " ".join(parts)


async def answer_assistant_question(user, question: str) -> str:
    from apps.assessments import services as assessment_services

    assessment = await assessment_services.get_latest_assessment(user)
    return _build_assistant_answer(question, assessment)
