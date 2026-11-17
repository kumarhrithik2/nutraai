from rest_framework import serializers
from apps.catalog.serializers import ProductListSerializer


class RecommendationItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    product = ProductListSerializer()
    reason = serializers.CharField()
    note = serializers.CharField(allow_blank=True, required=False, default="")
    flagged = serializers.BooleanField()


class RecommendationSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    assessment_id = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    items = RecommendationItemSerializer(many=True)
