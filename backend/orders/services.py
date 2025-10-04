from decimal import Decimal
from django.db import transaction
from django.db.models import F
from .models import Order, OrderItem, OrderHistory
from products.models import Product, ProductVariant, RoleBasedProduct, ProductVariantPrice, ProductVariantBulkPrice,StockInventory
from accounts.models import Wallet, StockistAssignment, WalletTransaction
from accounts.utils import create_notification
from rest_framework.exceptions import ValidationError


class OrderService:

    @staticmethod
    def create_bulk_order(user, items_data):
        """
        Processes a bulk order by validating product/variant, checking wallet balance, 
        and creating the order with proper price calculations.
        """
        if not items_data or not isinstance(items_data, list):
            raise ValidationError("Invalid or empty 'items' list.")

        with transaction.atomic():
            # 🔹 Lock wallet for this user
            try:
                wallet = Wallet.objects.select_for_update().get(user=user)
            except Wallet.DoesNotExist:
                raise ValidationError("Wallet not found for this user.")

            if wallet.current_balance < 10:
                raise ValidationError("Insufficient wallet balance. Minimum balance required is 10.")

            total_price = Decimal('0.00')
            validated_items = []

            # 🔹 Validate and calculate all items
            for item in items_data:
                product_id = item.get("product_id")
                variant_id = item.get("variant_id")
                quantity = int(item.get("quantity", 1))

                if not product_id or not variant_id:
                    raise ValidationError("Each item must include 'product_id' and 'variant_id'.")

                try:
                    product = Product.objects.get(id=product_id, is_active=True)
                    variant = ProductVariant.objects.get(id=variant_id, product=product)
                except (Product.DoesNotExist, ProductVariant.DoesNotExist):
                    raise ValidationError(f"Invalid product or variant for item: {item}")

                # 🔹 Determine pricing
                price_obj = (
                    ProductVariantPrice.objects.filter(variant=variant, user=product.owner, role="vendor")
                    .first()
                    or variant.product_variant_prices.filter(role='vendor').first()
                )

                if not price_obj:
                    raise ValidationError(f"No valid price configuration found for product {product.name}.")

                unit_price = price_obj.actual_price or 0
                discount_percentage = price_obj.discount or 0
                gst_percentage = price_obj.gst_percentage or 0

                # 🔹 Check bulk pricing
                bulk_price = ProductVariantBulkPrice.objects.filter(
                    variant=variant, max_quantity__lte=quantity
                ).first()
                if bulk_price:
                    unit_price = bulk_price.price

                # 🔹 Calculate totals
                discount_amount_per_unit = (unit_price * discount_percentage) / 100
                discounted_price = unit_price - discount_amount_per_unit
                gst_amount_per_unit = (discounted_price * gst_percentage) / 100
                final_price_per_unit = discounted_price + gst_amount_per_unit

                line_total = final_price_per_unit * quantity
                total_price += line_total

                validated_items.append({
                    "product": product,
                    "variant": variant,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "discount_percentage": discount_percentage,
                    "discount_amount": discount_amount_per_unit * quantity,
                    "gst_percentage": gst_percentage,
                    "gst_amount": gst_amount_per_unit * quantity,
                    "line_total": line_total
                })

            # 🔹 Final wallet balance check
            if wallet.current_balance < total_price:
                raise ValidationError("Insufficient wallet balance for this order.")

            # Deduct wallet balance atomically
            wallet.current_balance = F('current_balance') - total_price
            wallet.save()

            # 🔹 Determine seller
            if user.role == "reseller":
                stockist_assignment = StockistAssignment.objects.filter(reseller=user).first()
                seller = stockist_assignment.stockist if stockist_assignment else None
            else:
                seller = validated_items[0]["product"].owner if validated_items else None

            # 🔹 Create the main order
            order = Order.objects.create(
                buyer=user,
                seller=seller,
                total_price=total_price,
                status='pending',
                description="Bulk order placed"
            )

            # 🔹 Wallet transaction record
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='DEBIT',
                amount=total_price,
                description=f"Payment for bulk order #{order.id}",
                transaction_status='SUCCESS',
                user_id=product.owner.unique_role_id,
                order_id=order.id
            )

            # 🔹 Notification
            create_notification(
                user=user,
                title="Order Placed Successfully",
                message=f"Your order #{order.id} has been placed successfully!",
                notification_type="order",
                related_url=f"/orders/{order.id}/"
            )

            # 🔹 Order history
            OrderHistory.objects.create(
                order=order,
                actor=user,
                action='pending',
                notes="Bulk order placed."
            )

            # 🔹 Create order items and adjust stock
            for item in validated_items:
                OrderItem.objects.create(
                    order=order,
                    product=item["product"],
                    variant=item["variant"],
                    quantity=item["quantity"],
                    unit_price=item["unit_price"],
                    discount_percentage=item["discount_percentage"],
                    gst_percentage=item["gst_percentage"],
                    role_based_product=RoleBasedProduct.objects.filter(
                        product=item["product"], user=user, role=user.role
                    ).first()
                )

                # Deduct stock (delegated to StockInventory logic)
                try:
                    stock_inv = StockInventory.objects.get(
                        user=seller,
                        product=item["product"],
                        variant=item.get("variant", None)
                    )
                    stock_inv.adjust_stock(
                        change_quantity=-item["quantity"],
                        action="ORDER",
                        reference_id=order.id
                    )
                except StockInventory.DoesNotExist:
                    raise ValidationError(
                        f"No stock found for product {item['product'].name} under seller {seller}."
                    )

            return order, total_price
        
            
    @staticmethod
    def create_order_from_cart(user, cart_items):
        """
        Create an order from shopping cart items
        """
        with transaction.atomic():
            try:
                wallet = Wallet.objects.select_for_update().get(user=user)
            except Wallet.DoesNotExist:
                raise ValidationError("Wallet not found for the user.")
            
            total_price = Decimal('0.00')
            validated_items = []

            for cart_item in cart_items:
                product_id = cart_item.get("product_id")
                variant_id = cart_item.get("variant_id")
                quantity = int(cart_item.get("quantity", 1))

                if not product_id:
                    raise ValidationError("Missing product_id.")

                try:
                    product = Product.objects.get(id=product_id, is_active=True)
                    variant = None
                    
                    if variant_id:
                        variant = ProductVariant.objects.get(id=variant_id, product=product, is_active=True)
                    
                    # Get appropriate pricing based on user role
                    role_based_product = RoleBasedProduct.objects.filter(
                        product=product,
                        user=user,
                        role=user.role
                    ).first()
                    
                    if not role_based_product:
                        raise ValidationError(f"No pricing available for product {product.name}")

                    # Use variant price if available, otherwise product price
                    if variant:
                        variant_price = ProductVariantPrice.objects.filter(
                            variant=variant,
                            user=user,
                            role=user.role
                        ).first()
                        
                        if variant_price:
                            unit_price = variant_price.actual_price
                            discount_percentage = variant_price.discount
                            gst_percentage = variant_price.gst_percentage
                        else:
                            unit_price = role_based_product.price
                            discount_percentage = 0
                            gst_percentage = 0
                    else:
                        unit_price = role_based_product.price
                        discount_percentage = 0
                        gst_percentage = 0

                    # Calculate line total
                    line_total = unit_price * quantity
                    total_price += line_total

                    validated_items.append({
                        "product": product,
                        "variant": variant,
                        "quantity": quantity,
                        "unit_price": unit_price,
                        "discount_percentage": discount_percentage,
                        "gst_percentage": gst_percentage,
                        "line_total": line_total,
                        "role_based_product": role_based_product
                    })

                except (Product.DoesNotExist, ProductVariant.DoesNotExist):
                    raise ValidationError("Invalid product or product variant.")

            if wallet.current_balance < total_price:
                raise ValidationError("Insufficient wallet balance.")

            # Deduct balance
            wallet.current_balance = F('current_balance') - total_price
            wallet.save()

            # Record wallet transaction
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='DEBIT',
                amount=total_price,
                description="Payment for order",
                transaction_status='SUCCESS'
            )
            
            # Determine seller based on first product
            seller = validated_items[0]["role_based_product"].user if validated_items else None

            # Create order
            order = Order.objects.create(
                buyer=user,
                seller=seller,
                total_price=total_price,
                status='pending',
                description="Order from shopping cart"
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
                action='pending',
                notes="Order placed from shopping cart."
            )

            # Create order items
            for item in validated_items:
                OrderItem.objects.create(
                    order=order,
                    product=item["product"],
                    variant=item["variant"],
                    quantity=item["quantity"],
                    unit_price=item["unit_price"],
                    discount_percentage=item["discount_percentage"],
                    gst_percentage=item["gst_percentage"],
                    role_based_product=item["role_based_product"]
                )

            return order, total_price