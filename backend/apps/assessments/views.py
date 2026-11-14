from adrf.views import APIView
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.core.exceptions import ApiError
from apps.core.pagination import paginate

from . import services
from .questions import STEPS
from .serializers import AssessmentInputSerializer, AssessmentListSerializer, AssessmentSerializer

TAG = ["Assessment"]


class QuestionsView(APIView):
    @extend_schema(tags=TAG, responses={200: dict}, summary="Assessment form definition")
    async def get(self, request):
        return Response({"version": "1.0", "steps": STEPS})


class AssessmentListCreateView(APIView):
    def get_throttles(self):
        if self.request.method == "POST":
            self.throttle_scope = "assessment"
            return [ScopedRateThrottle()]
        return super().get_throttles()

    @extend_schema(tags=TAG, responses=AssessmentListSerializer(many=True), summary="My assessments")
    async def get(self, request):
        return await paginate(request, services.assessments_for(request.user), AssessmentListSerializer)

    @extend_schema(
        tags=TAG, request=AssessmentInputSerializer, responses={201: AssessmentSerializer},
        summary="Submit the health assessment (records consent, computes BMI)",
    )
    async def post(self, request):
        serializer = AssessmentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assessment = await services.submit_assessment(
            request.user, serializer.validated_data, request=request
        )
        return Response(AssessmentSerializer(assessment).data, status=status.HTTP_201_CREATED)


class AssessmentLatestView(APIView):
    @extend_schema(tags=TAG, responses=AssessmentSerializer, summary="My most recent assessment")
    async def get(self, request):
        obj = await services.get_latest_assessment(request.user)
        if obj is None:
            raise ApiError("You have not taken the assessment yet.", code="not_found", status_code=404)
        return Response(AssessmentSerializer(obj).data)


class AssessmentDetailView(APIView):
    @extend_schema(tags=TAG, responses=AssessmentSerializer, summary="Assessment detail")
    async def get(self, request, pk: int):
        return Response(AssessmentSerializer(await services.get_assessment(request.user, pk)).data)
