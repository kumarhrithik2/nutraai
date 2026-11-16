import os

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.models import User
from apps.profiles.models import Profile


class Command(BaseCommand):
    help = "Securely provision the fixed administrator account (admin@nutraai.com)."

    @transaction.atomic
    def handle(self, *args, **options):
        email = "admin@nutraai.com"
        password = os.environ.get("ADMIN_PASSWORD", "").strip()

        if not password:
            raise CommandError(
                "ADMIN_PASSWORD environment variable is required to provision the admin account. "
                "Set ADMIN_PASSWORD in your environment with a strong password and retry."
            )

        if len(password) < 8:
            raise CommandError("ADMIN_PASSWORD must be at least 8 characters long.")

        user = User.objects.filter(email=email).first()
        created = False
        if user is None:
            user = User(
                email=email,
                role=User.Role.ADMIN,
                is_staff=True,
                is_superuser=True,
                is_active=True,
            )
            created = True
        else:
            user.role = User.Role.ADMIN
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True

        user.set_password(password)
        user.save()

        profile, _ = Profile.objects.get_or_create(
            user=user,
            defaults={"full_name": "NutraAI Administrator"},
        )
        if not profile.full_name:
            profile.full_name = "NutraAI Administrator"
            profile.save(update_fields=["full_name"])

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(f"{action} administrator account '{email}' successfully.")
        )
