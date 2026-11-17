from adrf.views import APIView
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response

from . import services
from .serializers import (
    MembershipSerializer,
    NotificationSerializer,
    PreferencesSerializer,
    ProgressCreateSerializer,
    ProgressEntrySerializer,
    SelectPlanSerializer,
)

TAG = ["Customer"]


class MembershipView(APIView):
    @extend_schema(tags=TAG, responses=MembershipSerializer)
    async def get(self, request):
        obj = await services.get_or_create_membership(request.user)
        return Response(MembershipSerializer(obj).data)

    @extend_schema(tags=TAG, request=SelectPlanSerializer, responses=MembershipSerializer)
    async def post(self, request):
        s = SelectPlanSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        obj = await services.select_plan(request.user, s.validated_data["plan"])
        return Response(MembershipSerializer(obj).data)


class SupplementSubscriptionsView(APIView):
    @extend_schema(tags=TAG)
    async def get(self, request):
        return Response([])


class SubscriptionDetailView(APIView):
    @extend_schema(tags=TAG)
    async def patch(self, request, pk: int):
        from apps.core.exceptions import ApiError
        raise ApiError("Supplement subscriptions are not configured.", code="not_available", status_code=400)


class BillingHistoryView(APIView):
    @extend_schema(tags=TAG)
    async def get(self, request):
        return Response({"count": 0, "page": 1, "page_size": 20, "total_pages": 1, "next": None, "previous": None, "results": []})


class ProgressListCreateView(APIView):
    @extend_schema(tags=TAG, responses=ProgressEntrySerializer(many=True))
    async def get(self, request):
        try:
            days = int(request.query_params.get("days", 30))
        except (TypeError, ValueError):
            days = 30
        items = await services.list_progress(request.user, days)
        return Response(ProgressEntrySerializer(items, many=True).data)

    @extend_schema(tags=TAG, request=ProgressCreateSerializer, responses=ProgressEntrySerializer)
    async def post(self, request):
        s = ProgressCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        obj = await services.log_progress(request.user, s.validated_data)
        return Response(ProgressEntrySerializer(obj).data, status=status.HTTP_201_CREATED)


class NotificationListView(APIView):
    @extend_schema(tags=TAG)
    async def get(self, request):
        items = await services.list_notifications(request.user)
        data = NotificationSerializer(items, many=True).data
        try:
            page = max(1, int(request.query_params.get("page", 1)))
            page_size = min(100, max(1, int(request.query_params.get("page_size", 20))))
        except (TypeError, ValueError):
            page, page_size = 1, 20
        start = (page - 1) * page_size
        results = data[start:start + page_size]
        count = len(data)
        total_pages = max(1, (count + page_size - 1) // page_size)
        return Response({
            "count": count, "page": page, "page_size": page_size, "total_pages": total_pages,
            "next": None if page >= total_pages else str(page + 1),
            "previous": None if page <= 1 else str(page - 1),
            "results": results,
        })


class NotificationUnreadCountView(APIView):
    async def get(self, request):
        return Response({"count": await services.unread_count(request.user)})


class NotificationReadView(APIView):
    async def post(self, request, pk: int):
        await services.mark_read(request.user, pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationReadAllView(APIView):
    async def post(self, request):
        await services.mark_all_read(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PreferencesView(APIView):
    @extend_schema(tags=TAG, responses=PreferencesSerializer)
    async def get(self, request):
        obj = await services.get_preferences(request.user)
        return Response(PreferencesSerializer(obj).data)

    @extend_schema(tags=TAG, request=PreferencesSerializer, responses=PreferencesSerializer)
    async def put(self, request):
        s = PreferencesSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        obj = await services.update_preferences(request.user, s.validated_data)
        return Response(PreferencesSerializer(obj).data)


GOAL_LABELS = {
    "energy": "Energy", "immunity": "Immunity", "sleep": "Sleep", "stress": "Stress",
    "bone_joint": "Bone and joint", "heart": "Heart", "hair_skin_nails": "Hair, skin and nails",
    "muscle": "Muscle", "digestion": "Digestion",
}
DIET_LABELS = {"vegetarian": "Vegetarian", "vegan": "Vegan", "eggetarian": "Eggetarian", "non_veg": "Non-vegetarian"}
WORK_LABELS = {"desk": "Desk", "field": "Field", "student": "Student", "homemaker": "Homemaker", "retired": "Retired"}
SUN_LABELS = {"low": "Low", "medium": "Medium", "high": "High"}


def _bmi_category(bmi_value):
    try:
        b = float(bmi_value)
    except Exception:
        return None
    if b < 18.5:
        return "Below 18.5 (underweight range)"
    if b < 25:
        return "18.5–24.9 (healthy range)"
    if b < 30:
        return "25–29.9 (overweight range)"
    return "30 or above (obesity range)"


class WellnessReportView(APIView):
    async def get(self, request):
        from apps.assessments import services as assessment_services
        from apps.assessments.models import Assessment
        from apps.core.exceptions import ApiError
        from apps.recommendations import services as rec_services
        from apps.recommendations.serializers import RecommendationSerializer

        assessment = await assessment_services.get_latest_assessment(request.user)
        if assessment is None:
            raise ApiError("No assessment found.", code="not_found", status_code=404)

        answers = assessment.answers or {}
        goals = answers.get("goals") or []
        goal_labels = [GOAL_LABELS.get(g, g.replace("_", " ").title()) for g in goals]

        # History (all assessments for this user)
        history_qs = Assessment.objects.filter(user=request.user).order_by("-created_at", "-id")
        history = [
            {"id": a.pk, "created_at": a.created_at, "bmi": str(a.bmi), "age_band": a.age_band}
            async for a in history_qs[:10]
        ]

        # Calculated/derived (deterministic, non-clinical)
        bmi_cat = _bmi_category(assessment.bmi)
        calculated = [
            {"label": "BMI", "value": str(assessment.bmi), "explanation": "Calculated from the height and weight you provided (weight kg / height m²)."},
            {"label": "BMI category", "value": bmi_cat or "Unavailable", "explanation": "Standard BMI ranges are shown for general context only and are not a diagnosis."},
            {"label": "Age band", "value": assessment.age_band, "explanation": "Derived from the age you provided at assessment time."},
        ]

        # Lifestyle indicators (from submitted answers)
        indicators = []
        if answers.get("sleep_hours") is not None:
            indicators.append({"label": "Sleep", "value": f"{answers.get('sleep_hours')} hours/night"})
        if answers.get("exercise_days") is not None:
            indicators.append({"label": "Exercise", "value": f"{answers.get('exercise_days')} days/week"})
        if answers.get("stress_level") is not None:
            indicators.append({"label": "Stress level", "value": f"{answers.get('stress_level')} / 5"})
        if answers.get("sun_exposure"):
            indicators.append({"label": "Sun exposure", "value": SUN_LABELS.get(answers.get("sun_exposure"), str(answers.get("sun_exposure")))})
        if answers.get("work_type"):
            indicators.append({"label": "Work type", "value": WORK_LABELS.get(answers.get("work_type"), str(answers.get("work_type")))})
        if answers.get("diet_type"):
            indicators.append({"label": "Diet type", "value": DIET_LABELS.get(answers.get("diet_type"), str(answers.get("diet_type")))})

        # Strengths / areas to watch (conservative, based on inputs only)
        strengths = []
        areas = []
        ex = answers.get("exercise_days")
        if ex is not None and ex >= 3:
            strengths.append("You reported regular weekly exercise.")
        elif ex is not None:
            areas.append("You reported limited weekly exercise; consider gradual, comfortable activity if appropriate for you.")
        sleep = answers.get("sleep_hours")
        try:
            if sleep is not None and float(sleep) >= 7:
                strengths.append("You reported 7+ hours of sleep per night.")
            elif sleep is not None:
                areas.append("You reported shorter sleep duration; consistent sleep routines may help.")
        except Exception:
            pass
        stress = answers.get("stress_level")
        if stress is not None and int(stress) >= 4:
            areas.append("You reported higher stress levels; stress-management routines may be worth exploring.")
        elif stress is not None and int(stress) <= 2:
            strengths.append("You reported lower stress levels.")
        if not strengths:
            strengths.append("No specific strengths could be inferred from the available inputs.")
        if not areas:
            areas.append("No specific areas needing attention were inferred from the available inputs.")

        # Personalized general wellness recommendations (educational, non-clinical)
        general = []
        if goal_labels:
            general.append(f"Focus on your selected goals: {', '.join(goal_labels)}.")
        if answers.get("diet_type") in {"vegetarian", "vegan"}:
            general.append("Given your diet preference, review nutrients such as B12 and iron with a qualified professional if needed.")
        if answers.get("sun_exposure") == "low":
            general.append("Limited sun exposure was reported; discuss vitamin D status with a qualified professional if concerned.")
        if not general:
            general.append("Complete all assessment steps to receive more tailored general wellness suggestions.")
        general.append("These suggestions are educational and not medical advice.")

        # Product recommendations from real pipeline
        rec_payload = None
        rec_items = []
        try:
            rec = await rec_services.get_latest(request.user)
            rec_payload = RecommendationSerializer(rec, context={"request": request}).data
            for item in (rec_payload.get("items") or [])[:6]:
                prod = item.get("product") or {}
                rec_items.append({
                    "name": prod.get("name"),
                    "slug": prod.get("slug"),
                    "reason": item.get("reason"),
                    "note": item.get("note") or "",
                })
        except Exception:
            rec_payload = None

        next_steps = [
            "Review your assessment overview and retake the assessment if your information changes.",
            "Explore recommended products and review their details before purchasing.",
            "Track your progress with regular check-ins.",
            "Consult a qualified healthcare professional for personal medical advice or concerns.",
        ]

        unavailable = []
        if not rec_items:
            unavailable.append("Product recommendations are unavailable (no matching published products or recommendations could be generated).")
        unavailable.append("Clinical wellness scores, diagnoses, and medical thresholds are not provided.")

        return Response({
            "assessment_id": assessment.pk,
            "created_at": assessment.created_at,
            "bmi": str(assessment.bmi),
            "age_band": assessment.age_band,
            "goals": goal_labels,
            "summary": "This detailed report summarizes your latest saved assessment inputs and calculated results. It is educational information, not medical advice.",
            "overall_summary": {
                "headline": f"Latest assessment completed on {assessment.created_at.strftime('%Y-%m-%d')}" if assessment.created_at else "Latest assessment",
                "details": "The report below reflects the information you submitted and deterministic calculations (such as BMI). It does not provide medical diagnoses.",
            },
            "calculated_results": calculated,
            "lifestyle_indicators": indicators,
            "strengths": strengths,
            "areas_to_watch": areas,
            "general_recommendations": general,
            "product_recommendations": rec_items,
            "next_steps": next_steps,
            "history": history,
            "unavailable": unavailable,
        })


class WellnessPlanView(APIView):
    async def get(self, request):
        from apps.assessments import services as assessment_services
        from apps.core.exceptions import ApiError
        assessment = await assessment_services.get_latest_assessment(request.user)
        if assessment is None:
            raise ApiError("No assessment found.", code="not_found", status_code=404)
        answers = assessment.answers or {}
        goals = [GOAL_LABELS.get(g, g.replace('_', ' ').title()) for g in (answers.get('goals') or [])]
        steps = [f"Focus on: {g}" for g in goals] or ["Complete your assessment to generate a wellness plan."]
        return Response({
            "assessment_id": assessment.pk,
            "created_at": assessment.created_at,
            "steps": steps,
            "note": "This plan is based on your assessment goals and is not medical advice.",
        })
