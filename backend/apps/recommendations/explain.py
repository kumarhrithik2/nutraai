"""Plain-language, non-medical explanations (deterministic templates)."""


def explain(reasons: list[str], answers: dict) -> str:
    if not reasons:
        return "Selected based on your assessment preferences and currently available products."
    unique = []
    for r in reasons:
        if r not in unique:
            unique.append(r)
    return " ".join(unique[:3])[:280]
