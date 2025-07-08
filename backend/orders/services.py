from decimal import Decimal
from django.db import transaction
from django.db.models import F
from .models import  Order, OrderItem, OrderHistory
from products.models import Product,ProductSize
from accounts.models import Wallet,StockistAssignment,WalletTransaction
from accounts.utils import create_notification
from rest_framework.exceptions import ValidationError

class OrderService:

    @staticmethod
    def create_bulk_order(user, items_data):
        """
        Processes a bulk order by validating product/size, checking wallet balance, and creating the order.
        """
        with transaction.atomic():
            try:
                wallet = Wallet.objects.select_for_update().get(user=user)
            except Wallet.DoesNotExist:
                raise ValidationError("Wallet not found for the user.")
            
            if wallet.balance < 10:
                raise ValidationError("Insufficient wallet balance.")
            
            total_price = Decimal('0.00')
            validated_items = []

            for item in items_data:
                product_id = item.get("product_id")
                size_id = item.get("size")["id"]
                quantity = item.get("quantity", 1)

                if not product_id or not size_id:
                    raise ValidationError("Missing product_id or product_size_id.")

                try:
                    product = Product.objects.get(id=product_id, is_featured=True)
                    product_size = ProductSize.objects.get(id=size_id)
                except (Product.DoesNotExist, ProductSize.DoesNotExist):
                    raise ValidationError("Invalid product or product size.")

                line_total = product_size.price * quantity
                total_price += line_total

                validated_items.append({
                    "product": product,
                    "product_size": product_size,
                    "quantity": quantity,
                    "price": product_size.price,
                })

            if wallet.balance < total_price:
                raise ValidationError("Insufficient wallet balance.")

            # Deduct balance
            wallet.balance = F('balance') - total_price
            wallet.save()

            # Record wallet transaction
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='DEBIT',
                amount=total_price,
                description="Payment for bulk order",
                transaction_status='SUCCESS'
            )
            

            # Assign order target
            if user.role == "reseller":
                stockist_assignment = StockistAssignment.objects.filter(reseller=user).last()
                created_for = stockist_assignment.stockist if stockist_assignment else None
            else:
                created_for = validated_items[0]["product"].owner

            # Create order
            order = Order.objects.create(
                created_by=user,
                created_for=created_for,
                total_price=total_price,
                status='new',
                description="Bulk order placed"
            )
            create_notification(
                user=user,
                title="Order Placed Successfully",
                message=f"Your order #{order.id} has been placed successfully!",
                notification_type="order",
                related_url=f"/orders/{order.id}/"
            )

            # Create order history
            OrderHistory.objects.create(
                order=order,
                actor=user,
                action='new',
                notes="Bulk order placed."
            )

            # Create order items
            for item in validated_items:
                OrderItem.objects.create(
                    order=order,
                    product=item["product"],
                    product_size=item["product_size"],
                    quantity=item["quantity"],
                    price=item["price"],
                )

            return order, total_price