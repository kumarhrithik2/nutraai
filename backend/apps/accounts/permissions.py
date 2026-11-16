from rest_framework.permissions import BasePermission

from .models import User


class IsAdminUserRole(BasePermission):
    """
    Enforces that the requesting user is authenticated and is an administrator
    (role='admin', is_staff=True, or is_superuser=True).
    """

    message = "Administrator access required."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(
            user
            and user.is_authenticated
            and (user.role == User.Role.ADMIN or user.is_staff or user.is_superuser)
        )
