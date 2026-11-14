from django.contrib import admin

from .models import Assessment


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    """Read-only. Health data: access is by permission only and every view is logged by the host."""

    list_display = ("id", "user", "age_band", "bmi", "created_at")
    list_filter = ("age_band",)
    search_fields = ("user__email",)
    readonly_fields = [f.name for f in Assessment._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
