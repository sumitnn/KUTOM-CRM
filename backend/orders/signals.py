from django.db.models.signals import post_save
from django.dispatch import receiver
from orders.models import Order
from .models import Sale  
from datetime import date
from django.db import transaction as db_transaction
from accounts.models import Wallet, WalletTransaction

@receiver(post_save, sender=Order)
def create_sales_on_delivery(sender, instance, **kwargs):
    if instance.status in ['delivered', 'received']:

        # Avoid duplicate entries
        if not Sale.objects.filter(order=instance).exists():
            for item in instance.items.all():
                Sale.objects.create(
                    order=instance,
                    seller=instance.created_for,
                    buyer=instance.created_by,
                    product=item.product,
                    product_size=item.product_size,
                    quantity=item.quantity,
                    price=item.price,
                    discount=item.discount,
                    total_price=item.total,
                    sale_date=date.today()
                )





@receiver(post_save, sender=Sale)
def create_wallet_transaction_for_sale(sender, instance, created, **kwargs):
    if created and not instance.transaction_created and instance.seller:
        try:
            with db_transaction.atomic():
                wallet, _ = Wallet.objects.get_or_create(user=instance.seller)
                wallet.balance += instance.total_price
                wallet.save()

                WalletTransaction.objects.create(
                    wallet=wallet,
                    transaction_type='CREDIT',
                    amount=instance.total_price,
                    description=f"Sale of {instance.product.name if instance.product else 'product'}",
                    transaction_status='SUCCESS'
                )

                instance.transaction_created = True
                instance.save(update_fields=['transaction_created'])
        except Exception as e:
            # Optional: Use logging instead of print
            print(f"Error creating wallet transaction: {e}")
