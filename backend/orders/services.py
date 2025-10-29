from decimal import Decimal
from django.db import transaction
from django.db.models import F
from .models import Order, OrderItem, OrderHistory
from products.models import Product, ProductVariant, RoleBasedProduct, ProductVariantPrice, ProductVariantBulkPrice,StockInventory
from accounts.models import Wallet, StockistAssignment, WalletTransaction,User
from accounts.utils import create_notification,send_template_email,send_email_to_user
from rest_framework.exceptions import ValidationError
from decimal import Decimal, ROUND_HALF_UP

class OrderService:

    @staticmethod
    def create_bulk_order(user, items_data):
        """
        Processes a bulk order by creating a SINGLE order with MULTIPLE items
        """
        if not items_data or not isinstance(items_data, list):
            raise ValidationError("Invalid or empty 'items' list.")
        
        with transaction.atomic():
            # Lock wallet for this user
            try:
                wallet = Wallet.objects.select_for_update().get(user=user)
            except Wallet.DoesNotExist:
                raise ValidationError("Wallet not found for this user.")

            if wallet.current_balance < 10:
                raise ValidationError("Insufficient wallet balance to place an order.")

            total_price = Decimal('0.00')
            validated_items = []
            sellers = set()

            # Validate and calculate all items
            for item in items_data:
                product_id = item.get("product_id")
                variant_id = item.get("variant_id")
                quantity = int(item.get("quantity", 1))
                rolebased_id = item.get("rolebasedid")

                if not product_id:
                    raise ValidationError("Each item must include 'product_id'.")

                try:
                    product = Product.objects.get(id=product_id, is_active=True)
                    variant = ProductVariant.objects.get(id=variant_id, product=product) if variant_id else None
                except (Product.DoesNotExist, ProductVariant.DoesNotExist):
                    raise ValidationError(f"Invalid product or variant for item: {item}")

                # Add seller to set
                sellers.add(product.owner)

                # Determine pricing
                price_obj = OrderService._get_product_pricing(variant, product.owner)
                if not price_obj:
                    raise ValidationError(f"No valid price configuration found for product {product.name}.")

                # Check bulk pricing
                bulk_price = ProductVariantBulkPrice.objects.filter(
                    variant=variant, max_quantity__lte=quantity
                ).order_by('-max_quantity').first()
                
                if bulk_price:
                    base_price = bulk_price.price
                    discount_percentage = bulk_price.discount
                    gst_percentage = bulk_price.gst_percentage
                else:
                    base_price = price_obj.price
                    discount_percentage = price_obj.discount
                    gst_percentage = price_obj.gst_percentage

                # 🧮 Apply formula (same as OrderItem.save)
                discount_value = (base_price * discount_percentage / Decimal('100.00')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                price_after_discount = base_price - discount_value
                gst_value = (price_after_discount * gst_percentage / Decimal('100.00')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                final_single_price = (price_after_discount + gst_value).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                line_total = (final_single_price * quantity).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

                total_price += line_total

                validated_items.append({
                    "product": product,
                    "variant": variant,
                    "quantity": quantity,
                    "unit_price": base_price,
                    "discount_percentage": discount_percentage,
                    "gst_percentage": gst_percentage,
                    "line_total": line_total,
                    "rolebased_id": rolebased_id,
                    "bulk_price_applied": bulk_price is not None,
                    "seller": product.owner  # Store seller for stock management
                })

            # Final wallet balance check
            if wallet.current_balance < total_price:
                raise ValidationError("Insufficient wallet balance for this order.")

            # Determine main seller for the order
            seller = OrderService._determine_seller(user, validated_items)

            # Create the SINGLE main order
            order = Order.objects.create(
                buyer=user,
                seller=seller,
                total_price=total_price,
                status='pending',
                description=f"Bulk order placed with {len(validated_items)} items"
            )

            # Deduct wallet balance
            wallet.current_balance = F('current_balance') - total_price
            wallet.save()
            wallet.refresh_from_db()

            # Create wallet transaction
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='DEBIT',
                amount=total_price,
                description=f"Payment for bulk order #{order.id} with {len(validated_items)} items",
                transaction_status='SUCCESS',
                user_id=seller.unique_role_id if hasattr(seller, 'unique_role_id') else None,
                order_id=order.id
            )

            # Create order items and adjust stock
            order_items_count = 0
            for item in validated_items:
                order_item = OrderItem.objects.create(
                    order=order,  # Same order for all items
                    product=item["product"],
                    variant=item["variant"],
                    quantity=item["quantity"],
                    unit_price=item["unit_price"],
                    discount_percentage=item["discount_percentage"],
                    gst_percentage=item["gst_percentage"],
                    role_based_product=RoleBasedProduct.objects.filter(id=item["rolebased_id"]).last() if item["rolebased_id"] else None,
                    bulk_price_applied=item["bulk_price_applied"]
                )
                order_items_count += 1

                # Adjust stock for this specific item
                OrderService._adjust_stock_for_item(order_item, item, order.id)

            # Create notifications and history
            OrderService._create_post_order_actions(user, order, total_price, order_items_count)

            return order, total_price, order_items_count

    @staticmethod
    def _get_product_pricing(variant, seller):
        """Get product pricing with fallback logic"""
        if variant:
            price_obj = ProductVariantPrice.objects.filter(
                variant=variant, user=seller, role="vendor"
            ).first()
            if price_obj:
                return price_obj
            
            price_obj = variant.product_variant_prices.filter(role='vendor').first()
            if price_obj:
                return price_obj
        return None

    @staticmethod
    def _determine_seller(user, validated_items):
        """Determine the main seller for the order"""
        if user.role == "reseller":
            stockist_assignment = StockistAssignment.objects.filter(reseller=user).first()
            return stockist_assignment.stockist if stockist_assignment else User.objects.filter(role='stockist', is_default_user=True).first()
        elif validated_items:
            # For multiple sellers, choose the first one or implement your logic
            return validated_items[0]["seller"]
        return None

    @staticmethod
    def _adjust_stock_for_item(order_item, item, order_id):
        """Adjust stock for a specific order item"""
        try:
            stock_inv = StockInventory.objects.filter(
                user=item["seller"],
                product=item["product"],
                variant=item.get("variant", None),
                total_quantity__gt=0,
                is_expired=False
            ).order_by('manufacture_date', 'created_at').first()

            if not stock_inv:
                raise ValidationError(
                    f"No available stock found for product {item['product'].name} under seller {item['seller']}."
                )

            if stock_inv.total_quantity < item["quantity"]:
                raise ValidationError(
                    f"Insufficient stock for product {item['product'].name}. Available: {stock_inv.total_quantity}, Requested: {item['quantity']}"
                )

            # Adjust stock
            stock_inv.adjust_stock(
                change_quantity=-item["quantity"],
                action="ORDER",
                reference_id=f"Order #{order_id} - Batch: {stock_inv.batch_number}, Expiry: {stock_inv.expiry_date}"
            )

            # Store batch information
            order_item.batch_number = stock_inv.batch_number
            order_item.manufacture_date = stock_inv.manufacture_date
            order_item.expiry_date = stock_inv.expiry_date
            order_item.save()

        except StockInventory.DoesNotExist:
            raise ValidationError(
                f"No stock found for product {item['product'].name} under seller {item['seller']}."
            )

    @staticmethod
    def _create_post_order_actions(user, order, total_price, items_count):
        """Create notifications, emails, and history after order creation"""
        # Notification
        create_notification(
            user=user,
            title="Order Placed Successfully And Wallet Amount Is Deducted",
            message=f"Your order #{order.id} with {items_count} items has been placed successfully!",
            notification_type="order",
            related_url=f"/orders/{order.id}/"
        )
        
        # Email notification
        send_email_to_user(
            to_email=user.email,
            subject="Order Placed Successfully and Wallet Amount Is Deducted",
            message=f"Your order #{order.id} with {items_count} items has been placed successfully! And Wallet Amount is Deducted {total_price}"
        )

        # Order history
        OrderHistory.objects.create(
            order=order,
            actor=user,
            action='pending',
            notes=f"Bulk order placed with {items_count} items."
        )