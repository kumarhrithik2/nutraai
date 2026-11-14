import pytest

pytestmark = pytest.mark.django_db
ADDR = {"full_name": "Asha Patil", "phone": "+91 98765 43210", "line1": "12 MG Road",
        "city": "Nashik", "state": "maharashtra", "pincode": "422001"}


def test_profile_get_patch(auth_client):
    assert auth_client.get("/api/v1/profile/").data["full_name"] == "Asha Patil"
    r = auth_client.patch("/api/v1/profile/", {"phone": "9876543210", "date_of_birth": "1990-05-01"})
    assert r.status_code == 200 and r.data["phone"] == "9876543210"
    assert auth_client.patch("/api/v1/profile/", {"phone": "123"}).status_code == 400
    assert auth_client.patch("/api/v1/profile/", {"date_of_birth": "2015-01-01"}).status_code == 400


def test_consent_flow(auth_client):
    r = auth_client.post("/api/v1/profile/consents/", {"kind": "marketing", "accepted": True})
    assert r.status_code == 200
    assert {x["kind"]: x["accepted"] for x in r.data}["marketing"] is True
    assert auth_client.post("/api/v1/profile/consents/", {"kind": "nope", "accepted": True}).status_code == 400


def test_addresses(auth_client):
    a = auth_client.post("/api/v1/addresses/", ADDR)
    assert a.status_code == 201 and a.data["is_default"] and a.data["phone"] == "9876543210"
    assert a.data["state"] == "Maharashtra"
    b = auth_client.post("/api/v1/addresses/", {**ADDR, "line1": "Other", "is_default": True})
    assert b.data["is_default"]
    assert auth_client.get(f"/api/v1/addresses/{a.data['id']}/").data["is_default"] is False
    assert auth_client.post("/api/v1/addresses/", {**ADDR, "pincode": "12"}).status_code == 400
    assert auth_client.delete(f"/api/v1/addresses/{b.data['id']}/").status_code == 204
    assert auth_client.get(f"/api/v1/addresses/{a.data['id']}/").data["is_default"] is True
    assert auth_client.patch(f"/api/v1/addresses/{a.data['id']}/", {"city": "Pune"}).data["city"] == "Pune"


def test_address_isolation(auth_client, api_client, db):
    from rest_framework_simplejwt.tokens import RefreshToken

    from apps.accounts.models import User

    a = auth_client.post("/api/v1/addresses/", ADDR).data["id"]
    other = User.objects.create_user("o@example.com", "Str0ng!Passw0rd")
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(other).access_token}")
    assert api_client.get(f"/api/v1/addresses/{a}/").status_code == 404
    assert api_client.delete(f"/api/v1/addresses/{a}/").status_code == 404
