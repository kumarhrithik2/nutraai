import re

from rest_framework import serializers

from apps.catalog.serializers import ProductListSerializer

from .models import Order, OrderEvent, OrderItem

KEY_RE = re.compile(r"^[A-Za-z0-9_\-:.]{8,64}$")


class CartItemSerializer(serializers.Serializer):
    """Expects CartItem instances loaded with select_related('product__category') + images."""

    product = ProductListSerializer(read_only=True)
    quantity = serializers.IntegerField()
    unit_price = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()
    available = serializers.SerializerMethodField()

    def get_unit_price(self, obj) -> str:
        return str(obj.product.price)

    def get_line_total(self, obj) -> str:
        return str((obj.product.price * obj.quantity).quantize(obj.product.price))

    def get_available(self, obj) -> bool:
        p = obj.product
        return p.is_active and p.stock >= obj.quantity


class CartSerializer(serializers.Serializer):
    items = CartItemSerializer(many=True)
    item_count = serializers.IntegerField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    shipping_fee = serializers.DecimalField(max_digits=8, decimal_places=2)
    total = serializers.DecimalField(max_digits=10, decimal_places=2)
    free_shipping_remaining = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=99, default=1)


class SetQuantitySerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=99)


class CheckoutSerializer(serializers.Serializer):
    address_id = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(max_length=300, required=False, allow_blank=True, default="")

    def validate_notes(self, value):
        return " ".join(value.split())


def validate_idempotency_key(value: str | None) -> str | None:
    if value is None or value == "":
        return None
    if not KEY_RE.match(value):
        raise serializers.ValidationError({"Idempotency-Key": ["Use 8-64 letters, digits or - _ : ."]})
    return value


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["name", "sku", "unit_price", "quantity", "line_total"]


class OrderEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderEvent
        fields = ["status", "note", "created_at"]


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = ["number", "status", "status_label", "total", "currency", "item_count", "created_at"]

    def get_item_count(self, obj) -> int:
        return sum(i.quantity for i in obj.items.all())


class OrderDetailSerializer(OrderListSerializer):
    """Needs prefetch_related('items', 'events')."""

    items = OrderItemSerializer(many=True, read_only=True)
    events = OrderEventSerializer(many=True, read_only=True)
    shipping_address = serializers.SerializerMethodField()

    class Meta(OrderListSerializer.Meta):
        fields = OrderListSerializer.Meta.fields + [
            "subtotal", "shipping_fee", "paid_at", "expires_at", "tracking_note", "notes",
            "shipping_address", "items", "events",
        ]

    def get_shipping_address(self, obj) -> dict:
        return {
            "full_name": obj.ship_full_name, "phone": obj.ship_phone, "line1": obj.ship_line1,
            "line2": obj.ship_line2, "city": obj.ship_city, "state": obj.ship_state,
            "pincode": obj.ship_pincode,
        }


class PaymentInitSerializer(serializers.Serializer):
    gateway = serializers.CharField()
    key_id = serializers.CharField()
    gateway_order_id = serializers.CharField()
    amount = serializers.IntegerField(help_text="In paise")
    currency = serializers.CharField()


class CheckoutResponseSerializer(serializers.Serializer):
    order = OrderDetailSerializer()
    payment = PaymentInitSerializer(allow_null=True)
