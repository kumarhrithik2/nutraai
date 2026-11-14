import pytest

pytestmark = pytest.mark.django_db
URL = "/api/v1/assessments/"
VALID = {
    "age": 34, "gender": "female", "height_cm": 160, "weight_kg": "58.5", "pregnant": False,
    "work_type": "desk", "sleep_hours": 6, "exercise_days": 2, "stress_level": 4,
    "diet_type": "vegetarian", "goals": ["energy", "sleep"], "conditions": ["none"],
    "takes_medicines": False, "allergies": ["none"], "health_data_consent": True,
    "disclaimer_accepted": True,
}


def test_requires_auth(api_client):
    assert api_client.post(URL, VALID).status_code == 401


def test_questions(auth_client):
    r = auth_client.get("/api/v1/assessment/questions/")
    assert r.status_code == 200 and r.data["steps"]


def test_submit_computes_bmi_and_records_consent(auth_client, user):
    r = auth_client.post(URL, VALID)
    assert r.status_code == 201, r.content
    assert float(r.data["bmi"]) == 22.9 and r.data["age_band"] == "30-39"
    c = auth_client.get("/api/v1/profile/consents/").data
    assert {x["kind"]: x["up_to_date"] for x in c}["health_data"] is True
    assert auth_client.get(URL + "latest/").data["id"] == r.data["id"]
    assert auth_client.get(URL).data["count"] == 1


@pytest.mark.parametrize("patch,field", [
    ({"age": 17}, "age"), ({"goals": ["energy", "sleep", "heart", "muscle"]}, "goals"),
    ({"conditions": ["none", "kidney"]}, "conditions"), ({"pregnant": None}, "pregnant"),
    ({"health_data_consent": False}, "health_data_consent"),
    ({"takes_medicines": True}, "medicines"), ({"gender": "robot"}, "gender"),
])
def test_validation(auth_client, patch, field):
    r = auth_client.post(URL, {**VALID, **patch})
    assert r.status_code == 400
    assert field in r.data["error"]["details"]


def test_isolation(auth_client, api_client, db):
    from rest_framework_simplejwt.tokens import RefreshToken

    from apps.accounts.models import User

    a = auth_client.post(URL, VALID).data["id"]
    other = User.objects.create_user("o@example.com", "Str0ng!Passw0rd")
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(other).access_token}")
    assert api_client.get(f"{URL}{a}/").status_code == 404
    assert api_client.get(URL + "latest/").status_code == 404
