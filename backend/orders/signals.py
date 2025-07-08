from django.db.models.signals import post_save
from django.dispatch import receiver
from orders.models import Order
from .models import Sale  
from datetime import date

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
