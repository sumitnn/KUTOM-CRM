from django.db.models.signals import pre_save,post_save
from django.dispatch import receiver
from .models import AdminProduct, ProductCommission


@receiver(post_save, sender=AdminProduct)
def create_product_commission(sender, instance, created, **kwargs):
    if created:
        # Only create if it doesn't exist
        ProductCommission.objects.get_or_create(admin_product=instance)