# recommendations (scaffold only)

Phase 1 AI Suggestions are intentionally **not implemented yet**. This folder reserves the
structure from the HLD (section 4 and 6.2) so the AI work can be added without touching other modules.

```
recommendations/
  engines/rules.py       # step 1: pharmacist rules -> candidate products
  engines/ml_ranker.py   # step 4 (Phase 2): LightGBM / logistic re-ranker
  safety.py              # step 2: allergy / pregnancy / medicine filter (runs last before explain)
  explain.py             # step 3: LLM explanation with template fallback
  pipeline.py            # runs RECOMMENDER_PIPELINE = ["rules", "safety", "explain"]
  training/              # Phase 2 training code (manage.py train_recommender)
```

How it plugs in later (no other module changes):
1. Add `apps.recommendations` to `INSTALLED_APPS` and one line in `config/api_urls.py`.
2. Connect to `apps.assessments.signals.assessment_submitted`.
3. Read products only through `apps.catalog.services`, assessments only through `apps.assessments.services`.
4. Ship behind the `ai_suggestions` feature flag (already defined, default off).
