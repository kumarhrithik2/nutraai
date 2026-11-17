"""Deterministic safety/eligibility filtering. No clinical advice."""
from __future__ import annotations


def _allergen_slugs(product) -> set[str]:
    slugs = set()
    try:
        for pi in product.product_ingredients.all():
            for allergen in pi.ingredient.allergens.all():
                slugs.add(getattr(allergen, "slug", ""))
    except Exception:
        pass
    return {s for s in slugs if s}


def filter_products(products, answers: dict):
    allergies = set(answers.get("allergies") or [])
    if "none" in allergies:
        allergies = set()
    pregnant = bool(answers.get("pregnant"))
    on_blood_thinners = bool(answers.get("on_blood_thinners"))
    conditions = set(answers.get("conditions") or [])
    if "none" in conditions:
        conditions = set()
    eligible, notes = [], {}
    for product in products:
        if allergies and (_allergen_slugs(product) & allergies):
            continue
        if pregnant and getattr(product, "requires_doctor_approval", False):
            continue
        eligible.append(product)
        product_notes = []
        if on_blood_thinners:
            name = (getattr(product, "name", "") or "").lower()
            if any(x in name for x in ["omega", "fish", "vitamin e", "ginkgo", "garlic"]):
                product_notes.append("You reported blood thinners; review this product with a healthcare professional before use.")
        if conditions & {"kidney", "liver", "heart"} and getattr(product, "requires_doctor_approval", False):
            product_notes.append("You reported a health condition; consider checking suitability with a healthcare professional.")
        if product_notes:
            pid = getattr(product, "pk", None) or getattr(product, "id", None)
            notes[pid] = " ".join(product_notes)
    return eligible, notes
