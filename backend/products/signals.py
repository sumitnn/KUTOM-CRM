from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils.text import slugify
from .models import Brand

@receiver(pre_save, sender=Brand)
def generate_unique_slug(sender, instance, **kwargs):
    if not instance.slug or instance.slug != slugify(instance.name):
        base_slug = slugify(instance.name)
        slug = base_slug
        counter = 1
        while Brand.objects.filter(slug=slug).exclude(pk=instance.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        instance.slug = slug
