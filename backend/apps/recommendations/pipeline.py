"""Deterministic recommendation pipeline: rules -> safety -> explain."""
from __future__ import annotations

from apps.catalog import services as catalog_services

from .engines.rules import build_hints, score_product
from .explain import explain
from .safety import filter_products


async def generate_for_assessment(assessment):
    answers = assessment.answers or {}
    hints = build_hints(answers)
    products = [p async for p in catalog_services.detail_queryset()]
    eligible, flagged_notes = filter_products(products, answers)
    scored = []
    for product in eligible:
        score, reasons = score_product(product, hints, answers)
        if score <= 0:
            continue
        scored.append((score, reasons, product))
    scored.sort(key=lambda x: (-x[0], getattr(x[2], "name", "")))
    items = []
    for idx, (score, reasons, product) in enumerate(scored[:6], start=1):
        pid = getattr(product, "pk", None) or getattr(product, "id", None)
        items.append({"id": idx, "product": product, "reason": explain(reasons, answers), "note": flagged_notes.get(pid, ""), "flagged": pid in flagged_notes, "score": score})
    return items
