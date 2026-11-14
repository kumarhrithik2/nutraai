"""Create the staff permission groups. Safe to run repeatedly (e.g. after every migrate)."""
from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand

# group -> {app_label.model: [actions]}
GROUPS = {
    "Pharmacist": {
        "catalog.product": ["view", "change"],
        "catalog.ingredient": ["view", "add", "change"],
        "catalog.allergen": ["view", "change"],
        "catalog.category": ["view"],
        "assessments.assessment": ["view"],
    },
    "Admin Staff": {
        "catalog.product": ["view", "add", "change", "delete"],
        "catalog.productimage": ["view", "add", "change", "delete"],
        "catalog.category": ["view", "add", "change", "delete"],
        "catalog.ingredient": ["view", "add", "change", "delete"],
        "catalog.allergen": ["view", "add", "change"],
        "orders.order": ["view", "change"],
        "orders.orderitem": ["view"],
        "orders.orderevent": ["view", "add"],
        "payments.payment": ["view"],
        "payments.webhookevent": ["view"],
        "accounts.user": ["view", "change"],
        "profiles.profile": ["view"],
        "core.featureflag": ["view", "add", "change"],
        "core.auditlog": ["view"],
    },
}


class Command(BaseCommand):
    help = "Create/refresh the 'Pharmacist' and 'Admin Staff' permission groups."

    def handle(self, *args, **options):
        for group_name, models in GROUPS.items():
            group, _ = Group.objects.get_or_create(name=group_name)
            perms = []
            for label, actions in models.items():
                app_label, model = label.split(".")
                for action in actions:
                    codename = f"{action}_{model}"
                    try:
                        perms.append(
                            Permission.objects.get(
                                content_type__app_label=app_label, codename=codename
                            )
                        )
                    except Permission.DoesNotExist:
                        self.stderr.write(f"  missing permission {app_label}.{codename}")
            group.permissions.set(perms)
            self.stdout.write(self.style.SUCCESS(f"{group_name}: {len(perms)} permissions"))
