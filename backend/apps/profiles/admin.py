from django.contrib import admin

from .models import Address, ConsentRecord, Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "user", "phone", "created_at")
    search_fields = ("full_name", "user__email")
    raw_id_fields = ("user",)

    def has_add_permission(self, request):
        return False


@admin.register(ConsentRecord)
class ConsentRecordAdmin(admin.ModelAdmin):
    list_display = ("user", "kind", "version", "accepted", "created_at")
    list_filter = ("kind", "accepted")
    search_fields = ("user__email",)
    readonly_fields = [f.name for f in ConsentRecord._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "city", "state", "pincode", "is_default")
    search_fields = ("user__email", "full_name", "pincode")
    raw_id_fields = ("user",)
