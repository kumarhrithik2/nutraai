# core

Shared plumbing. Nothing here knows about products, orders or health data.

| File | Purpose |
| --- | --- |
| `models.py` | `TimeStampedModel`, `AuditLog`, `FeatureFlag` |
| `services.py` | `audit()` / `audit_sync()`, `flag_enabled()` (the module's public door) |
| `exceptions.py` | `ApiError` and the single JSON error shape |
| `pagination.py` | `paginate()`: async pagination used by every list endpoint |
| `utils.py` | client IP, `aupdate_instance()` |

## Async rules for this codebase

1. Views are `async def` (adrf `APIView`). **All HTTP methods of one view must be async.**
2. Single-row reads/writes use the native async ORM (`aget`, `acreate`, `asave`, `async for`).
3. Anything that needs a DB **transaction** or several dependent writes lives in a normal
   sync function in `services.py` and is called with `sync_to_async(...)`.
4. Serializers must not hit the database (no `UniqueValidator`, no `PrimaryKeyRelatedField`).
   Do those lookups in the service layer instead.
5. Prefetch everything a serializer touches (`select_related` / `prefetch_related`).
6. Password hashing and file I/O go through `sync_to_async` / `acheck_password`.
