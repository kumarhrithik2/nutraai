import pytest

pytestmark = pytest.mark.django_db


def test_error_envelope_404(api_client):
    r = api_client.get("/api/v1/products/nope/")
    assert r.status_code == 404 and r.data["error"]["code"] == "not_found"


def test_delete_account_erases_data(auth_client, user, catalog):
    r = auth_client.post("/api/v1/me/delete/", {"password": "wrong"})
    assert r.status_code == 400
    auth_client.post("/api/v1/addresses/", {"full_name": "A", "phone": "9876543210", "line1": "x",
                                            "city": "c", "state": "Goa", "pincode": "403001"})
    assert auth_client.post("/api/v1/me/delete/", {"password": "Str0ng!Passw0rd"}).status_code == 204
    user.refresh_from_db()
    assert not user.is_active and user.email.endswith("@deleted.invalid")
    assert user.profile.full_name == "Deleted user"
    assert not user.addresses.exists()


def test_openapi_schema(api_client, settings):
    settings.API_DOCS_ENABLED = True
    from drf_spectacular.generators import SchemaGenerator

    schema = SchemaGenerator().get_schema(request=None, public=True)
    assert "/api/v1/checkout/" in schema["paths"]
