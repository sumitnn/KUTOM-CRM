from decimal import Decimal
from django.db import transaction
from django.db.models import F
from .models import  Order, OrderItem, OrderHistory
from products.models import Product
from accounts.models import Wallet,StockistAssignment

from rest_framework.exceptions import ValidationError

class OrderService:

    @staticmethod
    def create_bulk_order(reseller, items_data):
        """
        This function processes the bulk order, checks wallet balance, and deducts balance from the reseller's wallet.
        """
        # Start the transaction block to make sure select_for_update works properly
        with transaction.atomic():  
            try:
                # Lock the wallet record for the reseller
                wallet = Wallet.objects.select_for_update().get(user=reseller)
            except Wallet.DoesNotExist:
                raise ValidationError("Reseller wallet not found.")

            total_price = Decimal(0)

            # Calculate total price for the order
            for item in items_data:
                product_id = item.get("product_id")
                quantity = item.get("quantity", 1)

                if not product_id:
                    raise ValueError("Missing product_id.")

                # Fetch the product (validate active status)
                product = Product.objects.get(id=product_id, active=True)
                total_price += product.selling_price * quantity

            # Check if the wallet has sufficient balance
            if wallet.balance < total_price:
                raise ValidationError("Insufficient wallet balance.")

            # Deduct the wallet balance inside the transaction
            wallet.balance = F('balance') - total_price
            wallet.save()

            stokist_Assign=StockistAssignment.objects.filter(reseller=reseller).last()

            # Create the Order
            order = Order.objects.create(
                reseller=reseller,
                stockist=stokist_Assign.stockist if stokist_Assign else None,  
                total_price=total_price,
                status='pending',  # waiting for stockist approval
                description="Bulk order placed"
            )

            # Create Order History entry
            OrderHistory.objects.create(
                order=order,
                actor=reseller,
                action='created',
                notes="Bulk order placed."
            )

            # Create OrderItems for each product in the bulk order
            for item in items_data:
                product = Product.objects.get(id=item["product_id"], active=True)
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=item["quantity"],
                    price=product.selling_price
                )

            return order, total_price