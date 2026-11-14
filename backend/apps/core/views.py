from adrf.views import APIView
from asgiref.sync import sync_to_async
from django.conf import settings
from django.core.cache import cache
from django.db import connection
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


def _ping_database() -> None:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")


class HealthView(APIView):
    """Liveness/readiness probe for DigitalOcean and for the React app ("API OK")."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = []

    @extend_schema(
        tags=["System"],
        responses={
            200: inline_serializer(
                "HealthOk",
                {
                    "status": serializers.CharField(),
                    "environment": serializers.CharField(),
                    "checks": serializers.DictField(child=serializers.CharField()),
                },
            ),
            503: OpenApiResponse(description="A dependency is down."),
        },
    )
    async def get(self, request):
        checks = {}
        try:
            await sync_to_async(_ping_database)()
            checks["database"] = "ok"
        except Exception:
            checks["database"] = "error"
        try:
            await cache.aset("health-check", "1", 5)
            checks["cache"] = "ok" if await cache.aget("health-check") == "1" else "error"
        except Exception:
            checks["cache"] = "error"

        healthy = all(v == "ok" for v in checks.values())
        return Response(
            {
                "status": "ok" if healthy else "degraded",
                "environment": settings.ENVIRONMENT,
                "checks": checks,
            },
            status=status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        )
