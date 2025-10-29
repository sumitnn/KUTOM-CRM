from django.db.models.signals import pre_save,post_save
from django.dispatch import receiver
from .models import RoleBasedProduct, ProductCommission,StockInventory,StockTransferRequest
from django.utils import timezone

@receiver(post_save, sender=RoleBasedProduct)
def create_or_update_variant_commissions(sender, instance, created, **kwargs):
    """
    Create or update commission entries for each variant 
    when a RoleBasedProduct (admin role) is created or updated.
    """
    if instance.role != 'admin':
        return  # Only admin products get commissions

    # Iterate over all variants linked to the RoleBasedProduct
    for variant in instance.variants.all():
        commission, created = ProductCommission.objects.get_or_create(
            role_product=instance,
            variant=variant,
            defaults={
                'commission_type': 'flat',
                'reseller_commission_value': 0,
                'stockist_commission_value': 0,
                'admin_commission_value': 0,
            }
        )
        if not created:
            commission.save()  # Update updated_at timestamp


@receiver(post_save, sender=StockTransferRequest)
def handle_stock_transfer_signals(sender, instance, created, **kwargs):
    """
    Handle stock updates automatically based on StockTransferRequest status.
    - RECEIVED: Add exchanged stock to receiver (raised_by)
    - REJECTED: Restore stock back to user (raised_by)
    """

    product = instance.product
    variant = instance.variant
    user = instance.raised_by
    old_batch_number = instance.batch_number
    new_batch_number = instance.new_batch_number

    # Safety check
    if not product or not user or not old_batch_number:
        return

    # ✅ CASE 1: When request is marked as RECEIVED
    if instance.status == StockTransferRequest.Status.RECEIVED and not instance.replacement_stock_added:
        try:
            # Find stock using OLD batch number
            stock = StockInventory.objects.get(
                product=product,
                variant=variant,
                user=user,
                batch_number=old_batch_number
            )

            # Update to new batch number if provided
            if new_batch_number and new_batch_number != old_batch_number:
                stock.batch_number = new_batch_number
                stock.save(update_fields=["batch_number", "updated_at"])

            # Add received quantity
            stock.adjust_stock(
                change_quantity=instance.quantity,
                action="EXCHANGED_STOCK_ADDED",
                reference_id=instance.request_id
            )

            # Mark as completed
            instance.replacement_stock_added = True
            instance.is_resolved = True
            instance.completed_at = timezone.now()
            instance.save(update_fields=["replacement_stock_added", "is_resolved", "completed_at", "updated_at"])

        except StockInventory.DoesNotExist:
            print(f"⚠️ No StockInventory found for {user} - {product.name} ({old_batch_number})")

    # ✅ CASE 2: When admin cancels or rejects the request
    elif instance.status == StockTransferRequest.Status.REJECTED and not instance.replacement_stock_added:
        try:
            # Find the same stock inventory
            stock = StockInventory.objects.get(
                product=product,
                variant=variant,
                user=user,
                batch_number=old_batch_number
            )

            # Add back the originally deducted stock
            stock.adjust_stock(
                change_quantity=instance.quantity,
                action="REQUEST_REJECTED_STOCK_RESTORED",
                reference_id=instance.request_id
            )

            # Prevent double stock restoration
            instance.original_stock_deducted = True
            instance.is_resolved = True
            instance.save(update_fields=["original_stock_deducted", "is_resolved", "updated_at"])

        except StockInventory.DoesNotExist:
            print(f"⚠️ No StockInventory found to restore for {user} - {product.name} ({old_batch_number})")