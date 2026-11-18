"""Add customer order archive (soft-delete) fields."""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0002_add_payment_method"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="hidden_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="order",
            name="hidden_by_customer",
            field=models.BooleanField(db_index=True, default=False),
        ),
    ]
