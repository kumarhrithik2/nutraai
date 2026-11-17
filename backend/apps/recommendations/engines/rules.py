"""Deterministic rule-based candidate generation from assessment answers."""
from __future__ import annotations

GOAL_HINTS = {
    "energy": ["vitamin b", "b12", "b-complex", "iron", "multivitamin", "energy"],
    "immunity": ["vitamin c", "zinc", "immunity", "immune", "vitamin d", "multivitamin"],
    "sleep": ["magnesium", "sleep", "melatonin", "ashwagandha", "calm"],
    "stress": ["ashwagandha", "magnesium", "stress", "calm", "adaptogen"],
    "bone_joint": ["calcium", "vitamin d", "joint", "bone", "collagen", "omega"],
    "heart": ["omega", "fish oil", "heart", "coq10", "magnesium"],
    "hair_skin_nails": ["biotin", "collagen", "hair", "skin", "nail", "zinc"],
    "muscle": ["protein", "creatine", "muscle", "amino", "magnesium"],
    "digestion": ["probiotic", "fiber", "digest", "gut", "enzyme"],
}
DEFICIENCY_HINTS = {"vitamin_d": ["vitamin d", "d3"], "b12": ["b12", "vitamin b12"], "iron": ["iron", "ferritin"]}


def _norm(text: str) -> str:
    return (text or "").lower()


def build_hints(answers: dict) -> list[tuple[str, str]]:
    hints: list[tuple[str, str]] = []
    for goal in answers.get("goals") or []:
        reason = f"Matches your goal: {goal.replace('_', ' ')}."
        for term in GOAL_HINTS.get(goal, []):
            hints.append((term, reason))
    for deficiency in answers.get("past_deficiencies") or []:
        if deficiency == "none_unknown":
            continue
        label = deficiency.replace("_", " ").upper() if deficiency == "b12" else deficiency.replace("_", " ")
        reason = f"Related to a past deficiency you reported ({label})."
        for term in DEFICIENCY_HINTS.get(deficiency, [deficiency.replace("_", " ")]):
            hints.append((term, reason))
    if (answers.get("sun_exposure") == "low") or (answers.get("work_type") == "desk"):
        hints.append(("vitamin d", "You reported limited sun exposure or desk-based routine."))
    if (answers.get("sleep_hours") or 8) <= 6:
        hints.append(("magnesium", "You reported shorter sleep duration."))
    if (answers.get("stress_level") or 1) >= 4:
        hints.append(("ashwagandha", "You reported higher stress levels."))
    if answers.get("diet_type") in {"vegetarian", "vegan"}:
        hints.append(("b12", "Your diet type can make B12 worth reviewing."))
        hints.append(("iron", "Your diet type can make iron worth reviewing."))
    seen, unique = set(), []
    for hint, reason in hints:
        key = (hint, reason)
        if key not in seen:
            seen.add(key)
            unique.append((hint, reason))
    return unique


def score_product(product, hints: list[tuple[str, str]], answers: dict):
    name = _norm(getattr(product, "name", ""))
    desc = _norm(getattr(product, "short_description", ""))
    category = _norm(getattr(getattr(product, "category", None), "name", ""))
    try:
        ingredients = " ".join(_norm(getattr(pi.ingredient, "name", "")) for pi in product.product_ingredients.all())
    except Exception:
        ingredients = ""
    haystack = " ".join([name, desc, category, ingredients])
    diet = answers.get("diet_type")
    if diet == "vegan" and not getattr(product, "is_vegan", False):
        if any(x in haystack for x in ["fish", "collagen", "gelatin", "whey"]):
            return 0, []
    if diet in {"vegetarian", "vegan"} and not getattr(product, "is_vegetarian", True):
        return 0, []
    score, reasons, seen_reasons = 0, [], set()
    for hint, reason in hints:
        if hint and hint in haystack:
            score += 2
            if reason not in seen_reasons:
                reasons.append(reason)
                seen_reasons.add(reason)
    if getattr(product, "is_featured", False):
        score += 1
    if getattr(product, "in_stock", False):
        score += 1
    return score, reasons
