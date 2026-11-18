"""Everything under /api/v1/. A new module = one new line here (HLD section 6.4)."""
from django.urls import include, path

urlpatterns = [
    path("", include("apps.core.urls")),
    path("", include("apps.accounts.urls")),
    path("", include("apps.profiles.urls")),
    path("", include("apps.assessments.urls")),
    path("", include("apps.catalog.urls")),
    path("", include("apps.orders.urls")),
    path("", include("apps.payments.urls")),
    path("", include("apps.recommendations.urls")),
    path("", include("apps.customer.urls")),
    path("", include("apps.admin_portal.urls")),
]
