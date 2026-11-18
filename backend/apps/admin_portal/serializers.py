from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.models import User
from apps.assessments.models import Assessment
from apps.catalog.models import Product
from apps.core.models import AuditLog
from apps.customer.models import Membership
from apps.orders.models import Order, OrderEvent, OrderItem
from apps.profiles.models import Profile

from .models import StockAdjustment, StoreSettings, SupplementSubscription


class AdminProductBriefSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    low_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "slug", "sku", "category", "category_slug", "price", "mrp", "stock", "is_active", "in_stock", "low_stock", "updated_at"]

    def get_low_stock(self, obj):
        threshold = self.context.get("low_stock_threshold", 5)
        return 0 < obj.stock <= threshold


class StockAdjustmentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    adjusted_by_email = serializers.SerializerMethodField()
    reason_label = serializers.CharField(source="get_reason_display", read_only=True)

    class Meta:
        model = StockAdjustment
        fields = ["id", "product", "product_name", "product_sku", "adjusted_by", "adjusted_by_email", "delta", "previous_stock", "new_stock", "reason", "reason_label", "note", "created_at"]
        read_only_fields = fields

    def get_adjusted_by_email(self, obj):
        return getattr(obj.adjusted_by, "email", None)


class StockAdjustInputSerializer(serializers.Serializer):
    delta = serializers.IntegerField()
    reason = serializers.ChoiceField(choices=StockAdjustment.Reason.choices, default=StockAdjustment.Reason.MANUAL)
    note = serializers.CharField(max_length=300, required=False, allow_blank=True, default="")

    def validate_delta(self, value):
        if value == 0:
            raise serializers.ValidationError("Stock change cannot be zero.")
        return value


class OrderItemAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "product_id", "name", "sku", "unit_price", "quantity", "line_total"]


class OrderEventAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderEvent
        fields = ["status", "note", "created_at"]


class AdminOrderListSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_label = serializers.CharField(source="get_payment_method_display", read_only=True)
    item_count = serializers.SerializerMethodField()
    customer_email = serializers.EmailField(source="user.email", read_only=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "number", "status", "status_label", "payment_method", "payment_method_label",
            "subtotal", "shipping_fee", "total", "currency", "item_count",
            "created_at", "paid_at", "cancelled_at", "expires_at", "tracking_note",
            "customer_email", "customer_name", "ship_full_name", "ship_city", "ship_state",
        ]

    def get_item_count(self, obj):
        return sum(i.quantity for i in obj.items.all())

    def get_customer_name(self, obj):
        profile = getattr(obj.user, "profile", None)
        return getattr(profile, "full_name", "") or obj.ship_full_name


class AdminOrderDetailSerializer(AdminOrderListSerializer):
    items = OrderItemAdminSerializer(many=True, read_only=True)
    events = OrderEventAdminSerializer(many=True, read_only=True)
    shipping_address = serializers.SerializerMethodField()
    payments = serializers.SerializerMethodField()

    class Meta(AdminOrderListSerializer.Meta):
        fields = AdminOrderListSerializer.Meta.fields + [
            "notes", "ship_phone", "ship_line1", "ship_line2", "ship_pincode", "contact_email",
            "shipping_address", "items", "events", "payments",
        ]

    def get_shipping_address(self, obj):
        return {
            "full_name": obj.ship_full_name, "phone": obj.ship_phone, "line1": obj.ship_line1,
            "line2": obj.ship_line2, "city": obj.ship_city, "state": obj.ship_state, "pincode": obj.ship_pincode,
        }

    def get_payments(self, obj):
        return [
            {
                "id": p.id, "gateway": p.gateway, "gateway_order_id": p.gateway_order_id,
                "gateway_payment_id": p.gateway_payment_id, "status": p.status,
                "amount_paise": p.amount_paise, "currency": p.currency, "created_at": p.created_at,
                "failure_reason": p.failure_reason,
            }
            for p in getattr(obj, "payments_cache", obj.payments.all())
        ]


class AdminOrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)
    note = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    tracking_note = serializers.CharField(max_length=200, required=False, allow_blank=True, allow_null=True)


class AdminOrderActionSerializer(serializers.Serializer):
    note = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")


class MembershipAdminSerializer(serializers.ModelSerializer):
    plan_label = serializers.CharField(source="get_plan_display", read_only=True)

    class Meta:
        model = Membership
        fields = ["plan", "plan_label", "status", "renewed_at", "created_at", "updated_at"]


class AdminCustomerListSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    order_count = serializers.IntegerField(read_only=True)
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, allow_null=True)
    membership = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "role", "is_active", "date_joined", "last_login", "name", "phone", "order_count", "total_spent", "membership"]

    def get_name(self, obj):
        return getattr(getattr(obj, "profile", None), "full_name", "") or obj.email

    def get_phone(self, obj):
        return getattr(getattr(obj, "profile", None), "phone", "")

    def get_membership(self, obj):
        m = getattr(obj, "membership", None)
        if not m:
            return None
        return {"plan": m.plan, "status": m.status, "renewed_at": m.renewed_at}


class AdminCustomerDetailSerializer(AdminCustomerListSerializer):
    profile = serializers.SerializerMethodField()
    preferences = serializers.SerializerMethodField()

    class Meta(AdminCustomerListSerializer.Meta):
        fields = AdminCustomerListSerializer.Meta.fields + ["profile", "preferences"]

    def get_profile(self, obj):
        p = getattr(obj, "profile", None)
        if not p:
            return None
        return {
            "full_name": p.full_name, "phone": p.phone, "date_of_birth": p.date_of_birth,
            "gender": p.gender, "avatar_url": getattr(p.avatar, "url", "") if getattr(p, "avatar", None) else "",
        }

    def get_preferences(self, obj):
        pref = getattr(obj, "preferences", None)
        if not pref:
            return None
        return {
            "language": getattr(pref, "language", "en"),
            "email_updates": getattr(pref, "email_updates", False),
            "in_app_notifications": getattr(pref, "in_app_notifications", True),
        }


class AssessmentBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = ["id", "bmi", "age_band", "created_at", "answers"]


class AdminCustomerStatusSerializer(serializers.Serializer):
    is_active = serializers.BooleanField()


class SupplementSubscriptionSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(source="product", queryset=Product.objects.all(), required=False, allow_null=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()
    product_display_name = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    frequency_label = serializers.CharField(source="get_frequency_display", read_only=True)

    class Meta:
        model = SupplementSubscription
        fields = [
            "id", "user", "user_email", "user_name", "product_id", "product_name", "product_display_name",
            "status", "status_label", "frequency", "frequency_label", "quantity",
            "next_delivery_date", "started_at", "cancelled_at", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "user", "user_email", "user_name", "product_display_name", "status_label", "frequency_label", "cancelled_at", "created_at", "updated_at"]

    def get_user_name(self, obj):
        return getattr(getattr(obj.user, "profile", None), "full_name", "") or obj.user.email

    def get_product_display_name(self, obj):
        if obj.product:
            return obj.product.name
        return obj.product_name


class SupplementSubscriptionCreateSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(source="user", queryset=User.objects.filter(role=User.Role.CUSTOMER))
    product_id = serializers.PrimaryKeyRelatedField(source="product", queryset=Product.objects.all(), required=False, allow_null=True)

    class Meta:
        model = SupplementSubscription
        fields = ["user_id", "product_id", "product_name", "status", "frequency", "quantity", "next_delivery_date", "started_at", "notes"]

    def validate(self, attrs):
        if not attrs.get("product") and not (attrs.get("product_name") or "").strip():
            raise serializers.ValidationError({"product_name": "Select a product or provide a product name."})
        if attrs.get("product") and not attrs.get("product_name"):
            attrs["product_name"] = attrs["product"].name
        return attrs


class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSettings
        fields = [
            "id", "store_name", "support_email", "support_phone", "currency",
            "low_stock_threshold", "cod_enabled", "online_payments_enabled",
            "order_notifications_email", "return_policy", "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ["id", "action", "actor_email", "target_type", "target_id", "metadata", "created_at"]

    def get_actor_email(self, obj):
        return getattr(obj.actor, "email", None)
