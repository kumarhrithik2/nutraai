"""Machine-readable form definition served at GET assessment/questions/.

The frontend may render from this or keep its own copy; the server validates either way.
"""
from . import choices as c

STEPS = [
    {"id": "about_you", "title": "About you", "fields": [
        {"name": "age", "label": "Age", "input": "number", "min": 18, "max": 90, "required": True},
        {"name": "gender", "label": "Gender", "input": "select", "options": c.options(c.GENDERS), "required": True},
        {"name": "height_cm", "label": "Height (cm)", "input": "number", "min": 100, "max": 250, "required": True},
        {"name": "weight_kg", "label": "Weight (kg)", "input": "number", "min": 25, "max": 300, "required": True},
        {"name": "pregnant", "label": "Are you pregnant?", "input": "boolean", "required": True,
         "show_if": {"gender": "female"}},
    ]},
    {"id": "lifestyle", "title": "Lifestyle", "fields": [
        {"name": "work_type", "label": "Work type", "input": "select", "options": c.options(c.WORK_TYPES), "required": True},
        {"name": "sleep_hours", "label": "Sleep hours per night", "input": "slider", "min": 3, "max": 12, "required": True},
        {"name": "exercise_days", "label": "Exercise days per week", "input": "number", "min": 0, "max": 7, "required": True},
        {"name": "stress_level", "label": "Stress level", "input": "scale", "min": 1, "max": 5, "required": True},
        {"name": "sun_exposure", "label": "Sun exposure", "input": "select", "options": c.options(c.SUN_EXPOSURE), "required": False},
    ]},
    {"id": "diet", "title": "Diet", "fields": [
        {"name": "diet_type", "label": "Diet type", "input": "select", "options": c.options(c.DIET_TYPES), "required": True},
    ]},
    {"id": "goals", "title": "Goals", "fields": [
        {"name": "goals", "label": "Health goals (up to 3)", "input": "multiselect",
         "options": c.options(c.GOALS), "max_items": c.MAX_GOALS, "required": True},
    ]},
    {"id": "health", "title": "Health", "fields": [
        {"name": "conditions", "label": "Existing conditions", "input": "multiselect",
         "options": c.options(c.CONDITIONS), "exclusive": "none", "required": True},
        {"name": "takes_medicines", "label": "Do you take regular medicines?", "input": "boolean", "required": True},
        {"name": "medicines", "label": "Which medicines?", "input": "text", "max_length": 500,
         "required": False, "show_if": {"takes_medicines": True}},
        {"name": "on_blood_thinners", "label": "Are any of them blood thinners?", "input": "boolean",
         "required": False, "show_if": {"takes_medicines": True}},
        {"name": "allergies", "label": "Allergies", "input": "multiselect",
         "options": c.options(c.ALLERGIES), "exclusive": "none", "required": True},
        {"name": "past_deficiencies", "label": "Past deficiencies", "input": "multiselect",
         "options": c.options(c.DEFICIENCIES), "exclusive": "none_unknown", "required": False},
    ]},
    {"id": "consent", "title": "Consent", "fields": [
        {"name": "health_data_consent", "label": "I consent to NutraAI processing my health information to suggest supplements.",
         "input": "checkbox", "required": True},
        {"name": "disclaimer_accepted", "label": "I understand suggestions are educational and not medical advice.",
         "input": "checkbox", "required": True},
    ]},
]
