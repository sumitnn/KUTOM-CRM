from django.db.models.signals import post_save
from django.dispatch import receiver
from orders.models import *
from datetime import date
from django.db import transaction as db_transaction
from accounts.models import Wallet, WalletTransaction
from products.models import Product, RoleBasedProduct, StockInventory


# @receiver(post_save, sender=Order)
# def handle_order_delivered(sender, instance, created, **kwargs):
#     """
#     Signal to handle order delivery.
#     When an order's status becomes 'delivered', create or update RoleBasedProduct & StockInventory.
#     """
#     if created:
#         return  

#     if instance.status != "delivered":
#         return  # Only trigger when order is marked delivered

#     buyer = instance.buyer

#     for item in instance.items.all():
#         # ---- 1. Create or Get RoleBasedProduct ----
#         role = getattr(buyer, "role", None)  # Assuming user model has role field
#         if not role:
#             continue  # Skip if buyer has no role

#         role_based_product, created_rbp = RoleBasedProduct.objects.get_or_create(
#             product=item.product,
#             user=buyer,
#             role=role,
#             defaults={
#                 "price": item.unit_price,  # store price at time of order
#             }
#         )

#         # If variants are used, ensure this variant is linked
#         if item.variant and item.variant not in role_based_product.variants.all():
#             role_based_product.variants.add(item.variant)

#         # ---- 2. Update StockInventory ----
#         stock_inv, created_inv = StockInventory.objects.get_or_create(
#             product=item.product,
#             variant=item.variant,
#             user=buyer,
#             defaults={
    
#                 "total_quantity": item.quantity,
#             }
#         )

#         if not created_inv:
#             stock_inv.total_quantity = stock_inv.total_quantity + item.quantity
#             stock_inv.save()