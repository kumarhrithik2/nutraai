from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.models import Group

from .models import User

ROLE_GROUPS = {User.Role.PHARMACIST: "Pharmacist", User.Role.ADMIN: "Admin Staff"}


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("-date_joined",)
    list_display = ("email", "role", "is_active", "is_staff", "date_joined")
    list_filter = ("role", "is_active", "is_staff", "is_superuser")
    search_fields = ("email",)
    readonly_fields = ("last_login", "date_joined")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Role & access", {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups",
                                      "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "role", "password1", "password2")}),
    )

    def save_model(self, request, obj, form, change):
        """Staff roles get Django Admin access and their group; customers do not."""
        if obj.role in ROLE_GROUPS:
            obj.is_staff = True
        elif not obj.is_superuser:
            obj.is_staff = False
        super().save_model(request, obj, form, change)
        group_name = ROLE_GROUPS.get(obj.role)
        if group_name and not obj.is_superuser:
            group = Group.objects.filter(name=group_name).first()
            if group:
                obj.groups.add(group)
