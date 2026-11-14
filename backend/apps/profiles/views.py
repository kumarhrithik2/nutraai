from adrf.views import APIView
from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.core.pagination import paginate
from apps.core.services import audit
from apps.core.utils import aupdate_instance, request_meta

from . import services
from .models import Address, Profile
from .serializers import (
    INDIAN_STATES,
    AddressPatchSerializer,
    AddressSerializer,
    AvatarUploadSerializer,
    ConsentInputSerializer,
    ConsentStateSerializer,
    OptionsSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
)

TAG = ["Profile"]


async def _profile_for(request) -> Profile:
    return await Profile.objects.select_related("user").aget(user_id=request.user.pk)


class ProfileView(APIView):
    @extend_schema(tags=TAG, responses=ProfileSerializer, summary="My profile")
    async def get(self, request):
        profile = await _profile_for(request)
        return Response(ProfileSerializer(profile, context={"request": request}).data)

    @extend_schema(
        tags=TAG, request=ProfileUpdateSerializer, responses=ProfileSerializer,
        summary="Update my profile (partial)",
    )
    async def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = await _profile_for(request)
        await aupdate_instance(profile, serializer.validated_data)
        await audit("profile.updated", request=request, actor=request.user,
                    fields=sorted(serializer.validated_data))
        return Response(ProfileSerializer(profile, context={"request": request}).data)


class AvatarView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "upload"

    @extend_schema(
        tags=TAG, request={"multipart/form-data": AvatarUploadSerializer},
        responses=ProfileSerializer, summary="Upload avatar (JPEG/PNG/WebP, max 5 MB)",
    )
    async def post(self, request):
        serializer = AvatarUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = await _profile_for(request)
        await services.set_avatar(profile, serializer.validated_data["avatar"])
        return Response(ProfileSerializer(profile, context={"request": request}).data)

    @extend_schema(tags=TAG, responses={204: None}, summary="Remove avatar")
    async def delete(self, request):
        profile = await _profile_for(request)
        await services.remove_avatar(profile)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OptionsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(tags=TAG, responses=OptionsSerializer, summary="Static form options")
    async def get(self, request):
        from .models import Profile as P

        return Response({
            "genders": [{"value": v, "label": label} for v, label in P.Gender.choices],
            "states": INDIAN_STATES,
            "consent_versions": settings.CONSENT_VERSIONS,
        })


class ConsentView(APIView):
    @extend_schema(tags=TAG, responses=ConsentStateSerializer(many=True), summary="My consent status")
    async def get(self, request):
        state = await services.current_consents(request.user)
        return Response(ConsentStateSerializer(list(state.values()), many=True).data)

    @extend_schema(
        tags=TAG, request=ConsentInputSerializer, responses=ConsentStateSerializer(many=True),
        summary="Grant or withdraw a consent (recorded with version, IP and time)",
    )
    async def post(self, request):
        serializer = ConsentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        kind, accepted = serializer.validated_data["kind"], serializer.validated_data["accepted"]
        ip, ua = request_meta(request)
        await services.arecord_consent(request.user, kind, accepted, ip=ip, user_agent=ua)
        await audit("consent.recorded", request=request, actor=request.user,
                    kind=kind, accepted=accepted)
        state = await services.current_consents(request.user)
        return Response(ConsentStateSerializer(list(state.values()), many=True).data)


class AddressListView(APIView):
    @extend_schema(tags=TAG, responses=AddressSerializer(many=True), summary="My saved addresses")
    async def get(self, request):
        qs = Address.objects.filter(user_id=request.user.pk)
        return await paginate(request, qs, AddressSerializer)

    @extend_schema(tags=TAG, request=AddressSerializer, responses={201: AddressSerializer},
                   summary="Add an address")
    async def post(self, request):
        serializer = AddressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        address = await services.create_address(request.user, dict(serializer.validated_data))
        return Response(AddressSerializer(address).data, status=status.HTTP_201_CREATED)


class AddressDetailView(APIView):
    @extend_schema(tags=TAG, responses=AddressSerializer, summary="Address detail")
    async def get(self, request, pk: int):
        return Response(AddressSerializer(await services.get_address(request.user, pk)).data)

    @extend_schema(tags=TAG, request=AddressPatchSerializer, responses=AddressSerializer,
                   summary="Update an address (partial)")
    async def patch(self, request, pk: int):
        serializer = AddressPatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        address = await services.update_address(request.user, pk, dict(serializer.validated_data))
        return Response(AddressSerializer(address).data)

    @extend_schema(tags=TAG, responses={204: None}, summary="Delete an address")
    async def delete(self, request, pk: int):
        await services.delete_address(request.user, pk)
        return Response(status=status.HTTP_204_NO_CONTENT)
