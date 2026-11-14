from adrf.views import APIView
from django.conf import settings
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.core.exceptions import ApiError

from . import services
from .cookies import clear_refresh_cookie, ensure_trusted_origin, set_refresh_cookie
from .serializers import (
    AccessTokenSerializer,
    AuthResponseSerializer,
    ChangeEmailSerializer,
    ChangePasswordSerializer,
    DeleteAccountSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
)

TAG = ["Auth & account"]


async def _auth_response(user, *, http_status=status.HTTP_200_OK) -> Response:
    """Body: {access, user}. The refresh token is set as an HTTP-only cookie."""
    access, refresh = await services.issue_tokens(user)
    user = await services.get_user_with_profile(user.pk)
    response = Response({"access": access, "user": UserSerializer(user).data}, status=http_status)
    set_refresh_cookie(response, refresh)
    return response


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    @extend_schema(
        tags=TAG,
        request=RegisterSerializer,
        responses={201: AuthResponseSerializer},
        summary="Create an account and sign in",
    )
    async def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = await services.register_user(
            email=data["email"],
            password=data["password"],
            full_name=data["full_name"],
            request=request,
        )
        return await _auth_response(user, http_status=status.HTTP_201_CREATED)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(
        tags=TAG,
        request=LoginSerializer,
        responses={200: AuthResponseSerializer, 401: OpenApiResponse(description="Bad credentials")},
        summary="Log in with email and password",
    )
    async def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = await services.login_user(request=request, **serializer.validated_data)
        return await _auth_response(user)


class RefreshView(APIView):
    """Reads the refresh cookie, returns a new access token and rotates the cookie."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "refresh"

    @extend_schema(
        tags=TAG,
        request=None,
        responses={200: AccessTokenSerializer, 401: OpenApiResponse(description="Session expired")},
        summary="Get a new access token using the refresh cookie",
    )
    async def post(self, request):
        ensure_trusted_origin(request)
        token = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if not token:
            raise ApiError("No active session.", code="no_session", status_code=401)
        try:
            access, refresh = await services.rotate_refresh_token(token)
        except ApiError as exc:
            response = Response({"error": {"code": exc.detail.code, "message": str(exc.detail)}},
                                status=exc.status_code)
            clear_refresh_cookie(response)
            return response
        response = Response({"access": access})
        set_refresh_cookie(response, refresh)
        return response


class LogoutView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "refresh"

    @extend_schema(tags=TAG, request=None, responses={204: None}, summary="Log out (revokes the refresh token)")
    async def post(self, request):
        ensure_trusted_origin(request)
        token = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if token:
            await services.revoke_refresh_token(token)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_refresh_cookie(response)
        return response


class MeView(APIView):
    @extend_schema(tags=TAG, responses={200: UserSerializer}, summary="Current user")
    async def get(self, request):
        user = await services.get_user_with_profile(request.user.pk)
        return Response(UserSerializer(user).data)


class ChangePasswordView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(
        tags=TAG,
        request=ChangePasswordSerializer,
        responses={200: AccessTokenSerializer},
        summary="Change password (signs out all other devices)",
    )
    async def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        await services.change_password(request.user, request=request, **serializer.validated_data)
        access, refresh = await services.issue_tokens(request.user)
        response = Response({"access": access})
        set_refresh_cookie(response, refresh)
        return response


class ChangeEmailView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(
        tags=TAG, request=ChangeEmailSerializer, responses={200: UserSerializer}, summary="Change email"
    )
    async def post(self, request):
        serializer = ChangeEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        await services.change_email(request.user, request=request, **serializer.validated_data)
        user = await services.get_user_with_profile(request.user.pk)
        return Response(UserSerializer(user).data)


class DeleteAccountView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(
        tags=TAG,
        request=DeleteAccountSerializer,
        responses={204: None},
        summary="Delete my account and personal data (irreversible)",
    )
    async def post(self, request):
        serializer = DeleteAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        await services.delete_account(
            request.user, password=serializer.validated_data["password"], request=request
        )
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_refresh_cookie(response)
        return response
