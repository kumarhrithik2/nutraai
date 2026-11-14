"""One consistent error shape for the whole API:

    {"error": {"code": "validation_error", "message": "...", "details": {...}}}
"""
import logging

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.exceptions import ErrorDetail
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


class ApiError(exceptions.APIException):
    """Raise from services/views to return a clean, coded error to the client."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "error"

    def __init__(self, message: str, *, code: str | None = None, status_code: int | None = None,
                 details=None):
        super().__init__(detail=message, code=code or self.default_code)
        if status_code is not None:
            self.status_code = status_code
        self.details = details


def _envelope(exc: exceptions.APIException) -> dict:
    if isinstance(exc, exceptions.ValidationError):
        return {
            "error": {
                "code": "validation_error",
                "message": "One or more fields are invalid.",
                "details": exc.detail,
            }
        }
    detail = exc.detail
    details = getattr(exc, "details", None)
    if isinstance(detail, ErrorDetail):
        message, code = str(detail), detail.code
    else:
        message, code = str(exc.default_detail), exc.default_code
        details = details or detail
    body = {"code": code, "message": message}
    if details:
        body["details"] = details
    return {"error": body}


def api_exception_handler(exc, context):
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied()

    if isinstance(exc, exceptions.APIException):
        response = drf_exception_handler(exc, context)
        if response is not None:
            response.data = _envelope(exc)
        return response

    if getattr(settings, "API_RERAISE_UNHANDLED", False):
        return None  # let tests see the real traceback
    logger.error("Unhandled error in %s", type(context["view"]).__name__, exc_info=exc)
    return Response(
        {"error": {"code": "server_error", "message": "Something went wrong. Please try again."}},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
