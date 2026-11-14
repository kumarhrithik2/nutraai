from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

if settings.ADMIN_REQUIRE_2FA:
    # Swap in django-otp's admin site so staff must pass a TOTP check after the password.
    from django_otp.admin import OTPAdminSite

    admin.site.__class__ = OTPAdminSite

admin.site.site_header = "NutraAI Labs administration"
admin.site.site_title = "NutraAI Labs admin"

urlpatterns = [
    path(settings.ADMIN_URL, admin.site.urls),
    path("api/v1/", include("config.api_urls")),
]

if settings.API_DOCS_ENABLED:
    from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

    urlpatterns += [
        path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
        path("api/v1/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
