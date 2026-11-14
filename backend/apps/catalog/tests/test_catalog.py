import pytest

pytestmark = pytest.mark.django_db
URL = "/api/v1/products/"


def slugs(resp):
    return [p["slug"] for p in resp.data["results"]]


def test_public_list_and_pagination(api_client, catalog):
    r = api_client.get(URL)
    assert r.status_code == 200 and r.data["count"] == 3
    r = api_client.get(URL, {"page_size": 1})
    assert len(r.data["results"]) == 1 and r.data["total_pages"] == 3


def test_filters(api_client, catalog):
    assert slugs(api_client.get(URL, {"category": "omega"})) == ["fish-oil"]
    assert set(slugs(api_client.get(URL, {"in_stock": "true"}))) == {"vitamin-d3", "fish-oil"}
    assert slugs(api_client.get(URL, {"vegan": "true"})) == ["vitamin-d3"]
    assert slugs(api_client.get(URL, {"min_price": 300})) == ["fish-oil"]
    assert slugs(api_client.get(URL, {"q": "fish"})) == ["fish-oil"]
    assert "fish-oil" not in slugs(api_client.get(URL, {"exclude_allergens": "fish"}))
    assert slugs(api_client.get(URL, {"ordering": "price_asc"}))[0] == "zinc"


def test_inactive_hidden(api_client, catalog):
    catalog["d3"].is_active = False
    catalog["d3"].save()
    assert api_client.get(URL + "vitamin-d3/").status_code == 404
    assert "vitamin-d3" not in slugs(api_client.get(URL))


def test_detail_and_facets(api_client, catalog):
    r = api_client.get(URL + "fish-oil/")
    assert r.status_code == 200
    assert r.data["ingredients"] == [{"name": "Fish oil", "amount": "1000 mg"}]
    assert r.data["allergens"][0]["slug"] == "fish"
    f = api_client.get(URL + "facets/")
    assert f.status_code == 200 and f.data["price"]["min"] is not None
    assert api_client.get("/api/v1/categories/").status_code == 200
