from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import FeatureFlag


@receiver([post_save, post_delete], sender=FeatureFlag)
def clear_flag_cache(sender, instance, **kwargs):
    cache.delete(f"flag:{instance.key}")
