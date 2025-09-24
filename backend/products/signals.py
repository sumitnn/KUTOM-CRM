from django.db.models.signals import pre_save,post_save
from django.dispatch import receiver
from .models import RoleBasedProduct, ProductCommission


@receiver(post_save, sender=RoleBasedProduct)
def create_or_update_product_commission(sender, instance, created, **kwargs):

    if instance.role == 'admin':
        # Use get_or_create to handle both creation and updates
        commission, created = ProductCommission.objects.get_or_create(
            role_product=instance,
            defaults={
                'commission_type': 'flat',
                'reseller_commission_value': 0,
                'stockist_commission_value': 0,
                'admin_commission_value': 0
            }
        )
        
        # If not newly created, you might want to update some fields
        if not created:
            commission.save()  # This will update the updated_at field