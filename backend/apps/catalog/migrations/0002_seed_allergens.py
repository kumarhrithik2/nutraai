from django.db import migrations

ALLERGENS = [("nuts", "Nuts"), ("soy", "Soy"), ("dairy", "Dairy"), ("gluten", "Gluten"),
             ("fish", "Fish"), ("shellfish", "Shellfish"), ("other", "Other")]


def seed(apps, schema_editor):
    Allergen = apps.get_model("catalog", "Allergen")
    for slug, name in ALLERGENS:
        Allergen.objects.get_or_create(slug=slug, defaults={"name": name})


class Migration(migrations.Migration):
    dependencies = [("catalog", "0001_initial")]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
