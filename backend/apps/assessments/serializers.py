from rest_framework import serializers

from . import choices as c
from .models import Assessment


class AssessmentInputSerializer(serializers.Serializer):
    """Validation only. No database access."""

    age = serializers.IntegerField(min_value=18, max_value=90)
    gender = serializers.ChoiceField(choices=c.GENDERS)
    height_cm = serializers.IntegerField(min_value=100, max_value=250)
    weight_kg = serializers.DecimalField(max_digits=5, decimal_places=1, min_value=25, max_value=300)
    pregnant = serializers.BooleanField(required=False, allow_null=True, default=None)

    work_type = serializers.ChoiceField(choices=c.WORK_TYPES)
    sleep_hours = serializers.DecimalField(max_digits=3, decimal_places=1, min_value=3, max_value=12)
    exercise_days = serializers.IntegerField(min_value=0, max_value=7)
    stress_level = serializers.IntegerField(min_value=1, max_value=5)
    sun_exposure = serializers.ChoiceField(choices=c.SUN_EXPOSURE, required=False, allow_null=True)

    diet_type = serializers.ChoiceField(choices=c.DIET_TYPES)
    goals = serializers.ListField(
        child=serializers.ChoiceField(choices=c.GOALS), min_length=1, max_length=c.MAX_GOALS
    )

    conditions = serializers.ListField(
        child=serializers.ChoiceField(choices=c.CONDITIONS), min_length=1, max_length=len(c.CONDITIONS)
    )
    takes_medicines = serializers.BooleanField()
    medicines = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    on_blood_thinners = serializers.BooleanField(required=False, default=False)
    allergies = serializers.ListField(
        child=serializers.ChoiceField(choices=c.ALLERGIES), min_length=1, max_length=len(c.ALLERGIES)
    )
    past_deficiencies = serializers.ListField(
        child=serializers.ChoiceField(choices=c.DEFICIENCIES), required=False, default=list,
        max_length=len(c.DEFICIENCIES),
    )

    health_data_consent = serializers.BooleanField()
    disclaimer_accepted = serializers.BooleanField()

    @staticmethod
    def _unique(values):
        return list(dict.fromkeys(values))

    def _exclusive(self, values, none_value, field):
        values = self._unique(values)
        if none_value in values and len(values) > 1:
            raise serializers.ValidationError(f"'{none_value}' cannot be combined with other choices.")
        return values

    def validate_goals(self, value):
        value = self._unique(value)
        if len(value) > c.MAX_GOALS:
            raise serializers.ValidationError(f"Choose up to {c.MAX_GOALS} goals.")
        return value

    def validate_conditions(self, value):
        return self._exclusive(value, "none", "conditions")

    def validate_allergies(self, value):
        return self._exclusive(value, "none", "allergies")

    def validate_past_deficiencies(self, value):
        return self._exclusive(value, "none_unknown", "past_deficiencies")

    def validate_medicines(self, value):
        return " ".join(value.split())

    def validate(self, attrs):
        errors = {}
        if attrs["gender"] == "female":
            if attrs.get("pregnant") is None:
                errors["pregnant"] = "Please answer this question."
        else:
            attrs["pregnant"] = False  # not shown for non-female; stored as False
        if attrs["takes_medicines"]:
            if not attrs.get("medicines") and not attrs.get("on_blood_thinners"):
                errors["medicines"] = "List your regular medicines."
        else:
            attrs["medicines"] = ""
            attrs["on_blood_thinners"] = False
        if not attrs["health_data_consent"]:
            errors["health_data_consent"] = "Your consent is required to process health information."
        if not attrs["disclaimer_accepted"]:
            errors["disclaimer_accepted"] = "Please accept the disclaimer to continue."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class AssessmentSerializer(serializers.ModelSerializer):
    bmi = serializers.DecimalField(max_digits=5, decimal_places=1, coerce_to_string=False)

    class Meta:
        model = Assessment
        fields = ["id", "answers", "bmi", "age_band", "created_at"]


class AssessmentListSerializer(serializers.ModelSerializer):
    bmi = serializers.DecimalField(max_digits=5, decimal_places=1, coerce_to_string=False)

    class Meta:
        model = Assessment
        fields = ["id", "bmi", "age_band", "created_at"]
