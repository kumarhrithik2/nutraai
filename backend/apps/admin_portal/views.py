from datetime import datetime

from adrf.views import APIView
from asgiref.sync import sync_to_async
from django.db.models import Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminUserRole
from apps.assessments.models import Assessment
from apps.catalog.models import Category, Product
from apps.core.exceptions import ApiError
from apps.core.pagination import paginate
from apps.orders.models import Order

from . import services
from .models import StockAdjustment, StoreSettings, SupplementSubscription
from .serializers import (
    AdminCustomerDetailSerializer,
    AdminCustomerListSerializer,
    AdminCustomerStatusSerializer,
    AdminOrderActionSerializer,
    AdminOrderDetailSerializer,
    AdminOrderListSerializer,
    AdminOrderStatusUpdateSerializer,
    AdminProductBriefSerializer,
    AssessmentBriefSerializer,
    AuditLogSerializer,
    MembershipAdminSerializer,
    StockAdjustInputSerializer,
    StockAdjustmentSerializer,
    StoreSettingsSerializer,
    SupplementSubscriptionCreateSerializer,
    SupplementSubscriptionSerializer,
)

TAG = ["Admin Portal"]


class AdminBaseView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception:
        return None


class AdminOverviewView(AdminBaseView):
    @extend_schema(tags=TAG, summary="Admin overview dashboard")
    async def get(self, request):
        data = await sync_to_async(services.overview_data)()
        threshold = data.get("low_stock_threshold")

        def _serialize():
            return {
                "kpis": data["kpis"],
                "recent_orders": AdminOrderListSerializer(data["recent_orders"], many=True).data,
                "low_stock_products": AdminProductBriefSerializer(
                    data["low_stock_products"], many=True, context={"low_stock_threshold": threshold}
                ).data,
                "recent_activity": AuditLogSerializer(data["recent_activity"], many=True).data,
                "charts": data["charts"],
                "generated_at": data["generated_at"],
            }

        return Response(await sync_to_async(_serialize)())


class AdminInventoryListView(AdminBaseView):
    @extend_schema(tags=TAG, summary="List inventory")
    async def get(self, request):
        settings = await sync_to_async(StoreSettings.get_solo)()
        threshold = settings.low_stock_threshold
        qs = Product.objects.select_related("category").prefetch_related("images").all()
        q = (request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(sku__icontains=q) | Q(slug__icontains=q) | Q(category__name__icontains=q))
        category = (request.query_params.get("category") or "").strip()
        if category and category != "All":
            qs = qs.filter(category__slug=category)
        stock_status = request.query_params.get("stock_status")
        if stock_status == "out_of_stock":
            qs = qs.filter(stock=0)
        elif stock_status == "low_stock":
            qs = qs.filter(stock__gt=0, stock__lte=threshold)
        elif stock_status == "in_stock":
            qs = qs.filter(stock__gt=threshold)
        is_active = request.query_params.get("is_active")
        if is_active in ("true", "1"):
            qs = qs.filter(is_active=True)
        elif is_active in ("false", "0"):
            qs = qs.filter(is_active=False)
        ordering = request.query_params.get("ordering") or "stock"
        allowed = {"stock", "-stock", "name", "-name", "updated_at", "-updated_at"}
        qs = qs.order_by(ordering if ordering in allowed else "stock")
        return await paginate(request, qs, AdminProductBriefSerializer, context={"low_stock_threshold": threshold})


class AdminInventoryAlertsView(AdminBaseView):
    @extend_schema(tags=TAG, summary="Inventory alerts")
    async def get(self, request):
        settings = await sync_to_async(StoreSettings.get_solo)()
        threshold = settings.low_stock_threshold
        low = [p async for p in Product.objects.select_related("category").filter(is_active=True, stock__gt=0, stock__lte=threshold).order_by("stock", "name")]
        out = [p async for p in Product.objects.select_related("category").filter(is_active=True, stock=0).order_by("name")]
        return Response({
            "threshold": threshold,
            "low_stock": AdminProductBriefSerializer(low, many=True, context={"low_stock_threshold": threshold}).data,
            "out_of_stock": AdminProductBriefSerializer(out, many=True, context={"low_stock_threshold": threshold}).data,
        })


class AdminInventoryAdjustView(AdminBaseView):
    @extend_schema(tags=TAG, request=StockAdjustInputSerializer, summary="Adjust product stock")
    async def post(self, request, product_id: int):
        s = StockAdjustInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        product, adj = await sync_to_async(services.adjust_stock_sync)(
            product_id=product_id,
            delta=s.validated_data["delta"],
            reason=s.validated_data.get("reason") or StockAdjustment.Reason.MANUAL,
            note=s.validated_data.get("note") or "",
            actor=request.user,
        )
        settings = await sync_to_async(StoreSettings.get_solo)()
        return Response({
            "product": AdminProductBriefSerializer(product, context={"low_stock_threshold": settings.low_stock_threshold}).data,
            "adjustment": StockAdjustmentSerializer(adj).data,
        })


class AdminStockAdjustmentsView(AdminBaseView):
    @extend_schema(tags=TAG, summary="Stock adjustment history")
    async def get(self, request):
        qs = StockAdjustment.objects.select_related("product", "adjusted_by").all()
        product_id = request.query_params.get("product_id")
        if product_id:
            qs = qs.filter(product_id=product_id)
        reason = request.query_params.get("reason")
        if reason:
            qs = qs.filter(reason=reason)
        return await paginate(request, qs, StockAdjustmentSerializer)


# ---------------------------- Orders ----------------------------
class AdminOrderListView(AdminBaseView):
    @extend_schema(tags=TAG, summary="List orders")
    async def get(self, request):
        qs = services.admin_orders_queryset()
        q = (request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(
                Q(number__icontains=q) | Q(user__email__icontains=q) | Q(ship_full_name__icontains=q) | Q(ship_phone__icontains=q) | Q(contact_email__icontains=q)
            )
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        payment_method = request.query_params.get("payment_method")
        if payment_method:
            qs = qs.filter(payment_method=payment_method)
        date_from = _parse_date(request.query_params.get("date_from"))
        date_to = _parse_date(request.query_params.get("date_to"))
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        ordering = request.query_params.get("ordering") or "-created_at"
        allowed = {"created_at", "-created_at", "total", "-total", "status", "-status"}
        qs = qs.order_by(ordering if ordering in allowed else "-created_at")
        return await paginate(request, qs, AdminOrderListSerializer)


class AdminOrderDetailView(AdminBaseView):
    @extend_schema(tags=TAG, summary="Order detail")
    async def get(self, request, number: str):
        order = await sync_to_async(services.admin_get_order)(number)
        return Response(AdminOrderDetailSerializer(order).data)


class AdminOrderStatusView(AdminBaseView):
    @extend_schema(tags=TAG, request=AdminOrderStatusUpdateSerializer, summary="Update order status")
    async def patch(self, request, number: str):
        s = AdminOrderStatusUpdateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        order = await sync_to_async(services.update_order_status_sync)(
            number=number,
            new_status=s.validated_data["status"],
            note=s.validated_data.get("note") or "",
            tracking_note=s.validated_data.get("tracking_note"),
            actor=request.user,
        )
        order = await sync_to_async(services.admin_get_order)(number)
        return Response(AdminOrderDetailSerializer(order).data)


class AdminOrderCollectCodView(AdminBaseView):
    @extend_schema(tags=TAG, request=AdminOrderActionSerializer, summary="Collect COD payment")
    async def post(self, request, number: str):
        s = AdminOrderActionSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        await sync_to_async(services.collect_cod_payment_sync)(number=number, note=s.validated_data.get("note") or "", actor=request.user)
        order = await sync_to_async(services.admin_get_order)(number)
        return Response(AdminOrderDetailSerializer(order).data)


class AdminOrderCancelView(AdminBaseView):
    @extend_schema(tags=TAG, request=AdminOrderActionSerializer, summary="Cancel order (admin)")
    async def post(self, request, number: str):
        s = AdminOrderActionSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        await sync_to_async(services.admin_cancel_order_sync)(number=number, note=s.validated_data.get("note") or "", actor=request.user)
        order = await sync_to_async(services.admin_get_order)(number)
        return Response(AdminOrderDetailSerializer(order).data)


# ---------------------------- Customers ----------------------------
class AdminCustomerListView(AdminBaseView):
    @extend_schema(tags=TAG, summary="List customers")
    async def get(self, request):
        qs = services.admin_customers_queryset()
        q = (request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(Q(email__icontains=q) | Q(profile__full_name__icontains=q) | Q(profile__phone__icontains=q))
        is_active = request.query_params.get("is_active")
        if is_active in ("true", "1"):
            qs = qs.filter(is_active=True)
        elif is_active in ("false", "0"):
            qs = qs.filter(is_active=False)
        plan = request.query_params.get("plan")
        if plan:
            qs = qs.filter(membership__plan=plan)
        ordering = request.query_params.get("ordering") or "-date_joined"
        allowed = {"date_joined", "-date_joined", "email", "-email", "last_login", "-last_login"}
        qs = qs.order_by(ordering if ordering in allowed else "-date_joined")
        return await paginate(request, qs, AdminCustomerListSerializer)


class AdminCustomerDetailView(AdminBaseView):
    @extend_schema(tags=TAG, summary="Customer detail")
    async def get(self, request, user_id: int):
        user = await sync_to_async(services.admin_get_customer)(user_id)
        orders = [o async for o in Order.objects.filter(user=user).prefetch_related("items").order_by("-created_at")[:20]]
        assessments = [a async for a in Assessment.objects.filter(user=user).order_by("-created_at")[:20]]
        data = AdminCustomerDetailSerializer(user).data
        data["orders"] = AdminOrderListSerializer(orders, many=True).data
        data["assessments"] = AssessmentBriefSerializer(assessments, many=True).data
        data["membership_detail"] = MembershipAdminSerializer(getattr(user, "membership", None)).data if getattr(user, "membership", None) else None
        return Response(data)


class AdminCustomerStatusView(AdminBaseView):
    @extend_schema(tags=TAG, request=AdminCustomerStatusSerializer, summary="Update customer account status")
    async def patch(self, request, user_id: int):
        s = AdminCustomerStatusSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        def _update():
            user = services.admin_get_customer(user_id)
            user.is_active = s.validated_data["is_active"]
            user.save(update_fields=["is_active"])
            return services.admin_get_customer(user_id)
        user = await sync_to_async(_update)()
        return Response(AdminCustomerDetailSerializer(user).data)


# ---------------------------- Subscriptions ----------------------------


# fix: re-implement memberships list properly
class AdminMembershipListView(AdminBaseView):
    @extend_schema(tags=TAG, summary="List memberships")
    async def get(self, request):
        from rest_framework import serializers as drf_serializers
        from .serializers import MembershipAdminSerializer
        qs = services.admin_memberships_queryset()
        q = (request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(Q(user__email__icontains=q) | Q(user__profile__full_name__icontains=q))
        plan = request.query_params.get("plan")
        if plan:
            qs = qs.filter(plan=plan)
        mstatus = request.query_params.get("status")
        if mstatus:
            qs = qs.filter(status=mstatus)

        class RowSer(MembershipAdminSerializer):
            user_id = drf_serializers.IntegerField(source="user.id", read_only=True)
            user_email = drf_serializers.EmailField(source="user.email", read_only=True)
            user_name = drf_serializers.SerializerMethodField()

            def get_user_name(self, obj):
                return getattr(getattr(obj.user, "profile", None), "full_name", "") or obj.user.email

            class Meta(MembershipAdminSerializer.Meta):
                fields = ["user_id", "user_email", "user_name"] + list(MembershipAdminSerializer.Meta.fields)

        return await paginate(request, qs, RowSer)


class AdminSupplementSubscriptionListCreateView(AdminBaseView):
    @extend_schema(tags=TAG, summary="List/create supplement subscriptions")
    async def get(self, request):
        qs = services.admin_supplement_subscriptions_queryset()
        q = (request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(Q(user__email__icontains=q) | Q(user__profile__full_name__icontains=q) | Q(product_name__icontains=q) | Q(product__name__icontains=q))
        st = request.query_params.get("status")
        if st:
            qs = qs.filter(status=st)
        return await paginate(request, qs, SupplementSubscriptionSerializer)

    @extend_schema(tags=TAG, request=SupplementSubscriptionCreateSerializer, responses=SupplementSubscriptionSerializer)
    async def post(self, request):
        s = SupplementSubscriptionCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        obj = await sync_to_async(s.save)()
        obj = await SupplementSubscription.objects.select_related("user", "user__profile", "product").aget(pk=obj.pk)
        return Response(SupplementSubscriptionSerializer(obj).data, status=status.HTTP_201_CREATED)


class AdminSupplementSubscriptionDetailView(AdminBaseView):
    async def _get(self, pk):
        obj = await SupplementSubscription.objects.select_related("user", "user__profile", "product").filter(pk=pk).afirst()
        if obj is None:
            raise ApiError("Subscription not found.", code="not_found", status_code=404)
        return obj

    @extend_schema(tags=TAG, responses=SupplementSubscriptionSerializer)
    async def get(self, request, pk: int):
        obj = await self._get(pk)
        return Response(SupplementSubscriptionSerializer(obj).data)

    @extend_schema(tags=TAG, request=SupplementSubscriptionSerializer, responses=SupplementSubscriptionSerializer)
    async def patch(self, request, pk: int):
        obj = await self._get(pk)
        def _save():
            ser = SupplementSubscriptionSerializer(obj, data=request.data, partial=True)
            ser.is_valid(raise_exception=True)
            from django.utils import timezone
            if ser.validated_data.get("status") == SupplementSubscription.Status.CANCELLED and obj.status != SupplementSubscription.Status.CANCELLED:
                ser.save(cancelled_at=timezone.now())
            else:
                ser.save()
            return SupplementSubscription.objects.select_related("user", "user__profile", "product").get(pk=pk)
        obj = await sync_to_async(_save)()
        return Response(SupplementSubscriptionSerializer(obj).data)

    @extend_schema(tags=TAG)
    async def delete(self, request, pk: int):
        obj = await self._get(pk)
        def _cancel():
            from django.utils import timezone
            obj.status = SupplementSubscription.Status.CANCELLED
            obj.cancelled_at = timezone.now()
            obj.save(update_fields=["status", "cancelled_at", "updated_at"])
        await sync_to_async(_cancel)()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------- Analytics ----------------------------
class AdminAnalyticsView(AdminBaseView):
    @extend_schema(tags=TAG, summary="Analytics dashboard")
    async def get(self, request):
        date_from = _parse_date(request.query_params.get("date_from"))
        date_to = _parse_date(request.query_params.get("date_to"))
        data = await sync_to_async(services.analytics_data)(date_from=date_from, date_to=date_to)
        return Response(data)


# ---------------------------- Settings ----------------------------
class AdminStoreSettingsView(AdminBaseView):
    @extend_schema(tags=TAG, responses=StoreSettingsSerializer)
    async def get(self, request):
        obj = await sync_to_async(StoreSettings.get_solo)()
        return Response(StoreSettingsSerializer(obj).data)

    @extend_schema(tags=TAG, request=StoreSettingsSerializer, responses=StoreSettingsSerializer)
    async def patch(self, request):
        def _save():
            obj = StoreSettings.get_solo()
            ser = StoreSettingsSerializer(obj, data=request.data, partial=True)
            ser.is_valid(raise_exception=True)
            ser.save(updated_by=request.user)
            return obj
        obj = await sync_to_async(_save)()
        return Response(StoreSettingsSerializer(obj).data)


class AdminProfileView(AdminBaseView):
    @extend_schema(tags=TAG, summary="Admin profile")
    async def get(self, request):
        from apps.accounts.serializers import UserSerializer
        user = request.user
        try:
            from apps.profiles.models import Profile
            profile = await Profile.objects.filter(user=user).afirst()
        except Exception:
            profile = None
        return Response({
            "id": user.id, "email": user.email, "role": getattr(user, "role", ""), "is_staff": user.is_staff,
            "name": getattr(profile, "full_name", "") if profile else "",
            "phone": getattr(profile, "phone", "") if profile else "",
            "date_joined": user.date_joined, "last_login": user.last_login,
        })

    @extend_schema(tags=TAG, summary="Update admin profile")
    async def patch(self, request):
        def _save():
            user = request.user
            name = request.data.get("name")
            phone = request.data.get("phone")
            from apps.profiles.models import Profile
            profile, _ = Profile.objects.get_or_create(user=user, defaults={"full_name": name or user.email})
            changed = []
            if name is not None:
                profile.full_name = str(name).strip()[:120]
                changed.append("full_name")
            if phone is not None:
                profile.phone = str(phone).strip()[:15]
                changed.append("phone")
            if changed:
                changed.append("updated_at")
                profile.save(update_fields=changed)
            return user, profile
        user, profile = await sync_to_async(_save)()
        return Response({
            "id": user.id, "email": user.email, "role": getattr(user, "role", ""),
            "name": profile.full_name, "phone": profile.phone,
            "date_joined": user.date_joined, "last_login": user.last_login,
        })
