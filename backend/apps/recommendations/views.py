from adrf.views import APIView
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response

from . import services
from .serializers import RecommendationSerializer

TAG = ["Recommendations"]


class RecommendationLatestView(APIView):
    @extend_schema(tags=TAG, responses=RecommendationSerializer, summary="Latest recommendations")
    async def get(self, request):
        result = await services.get_latest(request.user)
        return Response(RecommendationSerializer(result, context={"request": request}).data)


class RecommendationDetailView(APIView):
    @extend_schema(tags=TAG, responses=RecommendationSerializer, summary="Recommendation by assessment id")
    async def get(self, request, pk: int):
        result = await services.get_latest(request.user)
        return Response(RecommendationSerializer(result, context={"request": request}).data)


class RecommendationFeedbackView(APIView):
    @extend_schema(tags=TAG, responses={204: None}, summary="Record recommendation feedback")
    async def post(self, request, recommendation_id: int):
        return Response(status=status.HTTP_204_NO_CONTENT)
