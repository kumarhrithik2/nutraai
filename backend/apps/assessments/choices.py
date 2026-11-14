"""Allowed answer values (slugs). Rules and the safety filter match on these exact strings."""
GENDERS = [("female", "Female"), ("male", "Male"), ("other", "Other"),
           ("prefer_not_to_say", "Prefer not to say")]
WORK_TYPES = [("desk", "Desk job"), ("field", "Field work"), ("student", "Student"),
              ("homemaker", "Homemaker"), ("retired", "Retired")]
SUN_EXPOSURE = [("low", "Low"), ("medium", "Medium"), ("high", "High")]
DIET_TYPES = [("vegetarian", "Vegetarian"), ("vegan", "Vegan"), ("eggetarian", "Eggetarian"),
              ("non_veg", "Non-vegetarian")]
GOALS = [("energy", "Energy"), ("immunity", "Immunity"), ("sleep", "Sleep"), ("stress", "Stress"),
         ("bone_joint", "Bone and joint"), ("heart", "Heart"),
         ("hair_skin_nails", "Hair, skin and nails"), ("muscle", "Muscle"),
         ("digestion", "Digestion")]
CONDITIONS = [("diabetes", "Diabetes"), ("thyroid", "Thyroid"), ("blood_pressure", "Blood pressure"),
              ("heart", "Heart"), ("kidney", "Kidney"), ("liver", "Liver"), ("pcos", "PCOS"),
              ("other", "Other"), ("none", "None")]
ALLERGIES = [("nuts", "Nuts"), ("soy", "Soy"), ("dairy", "Dairy"), ("gluten", "Gluten"),
             ("fish", "Fish"), ("shellfish", "Shellfish"), ("other", "Other"), ("none", "None")]
DEFICIENCIES = [("vitamin_d", "Vitamin D"), ("b12", "Vitamin B12"), ("iron", "Iron"),
                ("none_unknown", "None / unknown")]

MAX_GOALS = 3


def values(choices) -> list[str]:
    return [v for v, _ in choices]


def options(choices) -> list[dict]:
    return [{"value": v, "label": label} for v, label in choices]
