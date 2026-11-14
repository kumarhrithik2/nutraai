import pytest
from django.conf import settings

pytestmark = pytest.mark.django_db
REG = {"full_name": "Asha Patil", "email": "Asha@Example.com",
       "password": "Str0ng!Passw0rd", "accept_terms": True}


def test_health(api_client):
    assert api_client.get("/api/v1/health/").status_code == 200


def test_register_login_me_refresh_logout(api_client):
    r = api_client.post("/api/v1/auth/register/", REG)
    assert r.status_code == 201, r.content
    assert r.data["user"]["email"] == "asha@example.com"
    assert settings.REFRESH_COOKIE_NAME in r.cookies
    assert r.cookies[settings.REFRESH_COOKIE_NAME]["httponly"]

    r = api_client.post("/api/v1/auth/login/", {"email": "asha@example.com", "password": REG["password"]})
    assert r.status_code == 200
    access = r.data["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    assert api_client.get("/api/v1/me/").data["full_name"] == "Asha Patil"

    old = api_client.cookies[settings.REFRESH_COOKIE_NAME].value
    r = api_client.post("/api/v1/auth/refresh/")
    assert r.status_code == 200 and "access" in r.data
    # rotated token: the old one is dead
    api_client.cookies[settings.REFRESH_COOKIE_NAME] = old
    assert api_client.post("/api/v1/auth/refresh/").status_code == 401

    assert api_client.post("/api/v1/auth/logout/").status_code == 204


def test_register_duplicate_and_weak(api_client):
    assert api_client.post("/api/v1/auth/register/", REG).status_code == 201
    r = api_client.post("/api/v1/auth/register/", REG)
    assert r.status_code == 400 and r.data["error"]["code"]
    r = api_client.post("/api/v1/auth/register/", {**REG, "email": "b@example.com", "password": "abc"})
    assert r.status_code == 400


def test_login_bad_password(api_client, user):
    r = api_client.post("/api/v1/auth/login/", {"email": user.email, "password": "nope-nope-1A!"})
    assert r.status_code == 401 and r.data["error"]["code"] == "invalid_credentials"


def test_me_requires_auth(api_client):
    assert api_client.get("/api/v1/me/").status_code == 401
