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
        with transaction.atomic():
            try:
                wallet = Wallet.objects.select_for_update().get(user=user)
            except Wallet.DoesNotExist:
                raise ValidationError("Wallet not found for the user.")
            
            if wallet.current_balance < 10:
                raise ValidationError("Insufficient wallet balance.")
            
            total_price = Decimal('0.00')
            validated_items = []
            

            for item in items_data:
                product_id = item.get("product_id")
                variant_id = item.get("variant_id")
                quantity = int(item.get("quantity", 1))

                if not product_id or not variant_id:
                    raise ValidationError("Missing product_id or variant_id.")

                try:
                    # Get product and variant
                    product = Product.objects.get(id=product_id, is_active=True)
                    variant = ProductVariant.objects.get(id=variant_id, product=product)
                    
                    # Get the appropriate price for the user's role
                    try:
                        variant_price = ProductVariantPrice.objects.get(
                            variant=variant,
                            user=product.owner,
                            role="vendor"
                        )
                        unit_price = variant_price.actual_price
                        discount_percentage = variant_price.discount
                        gst_percentage = variant_price.gst_percentage
                    except ProductVariantPrice.DoesNotExist:
                        # Fallback to variant default price
                        price_obj = variant.product_variant_prices.filter(role='vendor').first()
                        unit_price = price_obj.actual_price if price_obj else 0
                        discount_percentage = price_obj.discount if price_obj else 0
                        gst_percentage = price_obj.gst_percentage if price_obj else 0

                    # Check bulk pricing
                    bulk_price = ProductVariantBulkPrice.objects.filter(
                        variant=variant,
                        max_quantity__lte=quantity
                    ).first()
                    
                    if bulk_price:
                        unit_price = bulk_price.price

                    # ✅ Calculate discount and GST
                    discount_amount_per_unit = (unit_price * discount_percentage) / 100
                    discounted_price = unit_price - discount_amount_per_unit
                    gst_amount_per_unit = (discounted_price * gst_percentage) / 100
                    final_price_per_unit = discounted_price + gst_amount_per_unit

                    # ✅ Line total now includes discount & GST
                    line_total = final_price_per_unit * quantity
                    total_price += line_total

                    validated_items.append({
                        "product": product,
                        "variant": variant,
                        "quantity": quantity,
                        "unit_price": unit_price,
                        "discount_percentage": discount_percentage,
                        "discount_amount": discount_amount_per_unit * quantity,  # 👈 total discount
                        "gst_percentage": gst_percentage,
                        "gst_amount": gst_amount_per_unit * quantity,  # 👈 total GST
                        "line_total": line_total
                    })

                except (Product.DoesNotExist, ProductVariant.DoesNotExist):
                    raise ValidationError("Invalid product or product variant.")

            if wallet.current_balance < total_price:
                raise ValidationError("Insufficient wallet balance.")

            # Deduct balance
            wallet.current_balance = F('current_balance') - total_price
            wallet.save()


            
            # Determine seller based on user role
            if user.role == "reseller":
                # For resellers, find their assigned stockist
                stockist_assignment = StockistAssignment.objects.filter(reseller=user).first()
                seller = stockist_assignment.stockist if stockist_assignment else None
            else:
                # For others, use the product owner (vendor)
                seller = validated_items[0]["product"].owner if validated_items else None

            # Create order
            order = Order.objects.create(
                buyer=user,
                seller=seller,
                total_price=total_price,
                status='pending',
                description="Bulk order placed"
            )
            # Record wallet transaction
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='DEBIT',
                amount=total_price,
                description="Payment for bulk order",
                transaction_status='SUCCESS',
                user_id=product.owner.unique_role_id,
                order_id=order.id
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
                notes="Bulk order placed."
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
                    role_based_product=RoleBasedProduct.objects.filter(
                        product=item["product"],
                        user=user,
                        role=user.role
                    ).first()
                )

                quantity = item["quantity"]

                # Find the stock inventory for this user/product/variant
                try:
                    stock_inv = StockInventory.objects.get(user=seller, product=item["product"], variant=item.get("variant", None))
                except StockInventory.DoesNotExist:
                    raise ValueError(
                        f"No stock found for user {user.username}, product {product.name}, variant {variant}"
                    )

                # Deduct stock (negative quantity) and create history entry
                stock_inv.adjust_stock(change_quantity=-quantity, action="ORDER", reference_id=order.id)

            return order, total_price
        
    @staticmethod
    def create_bulk_order_from_admin(buyer, items_data):
        """
        Stockist or reseller buys from admin's catalog.
        Creates an order, deducts from inventory, and records wallet transaction.
        """
        with transaction.atomic():
            # Lock buyer's wallet
            try:
                wallet = Wallet.objects.select_for_update().get(user=buyer)
            except Wallet.DoesNotExist:
                raise ValidationError("Wallet not found for the buyer.")

            if wallet.current_balance < 10:
                raise ValidationError("Insufficient wallet balance.")

            total_price = Decimal('0.00')
            validated_items = []

            # Validate and prepare items
            for item in items_data:
                product_id = item.get("product_id")
                variant_id = item.get("variant_id")
                quantity = int(item.get("quantity", 1))

                if not product_id or not variant_id:
                    raise ValidationError("Missing product_id or variant_id.")

                try:
                    # Get product and variant
                    product = Product.objects.get(id=product_id, is_active=True)
                    variant = ProductVariant.objects.get(id=variant_id, product=product, is_active=True)
                    
                    # Get admin pricing for the variant
                    try:
                        variant_price = ProductVariantPrice.objects.get(
                            variant=variant,
                            user__role='admin',
                            role='admin'
                        )
                        unit_price = variant_price.actual_price
                        discount_percentage = variant_price.discount
                        gst_percentage = variant_price.gst_percentage
                    except ProductVariantPrice.DoesNotExist:
                        raise ValidationError(f"No admin pricing found for variant {variant.name}")

                    # Check inventory
                    inventory = variant.stock_inventories.filter(user__role='admin').first()
                    if not inventory or inventory.total_quantity < quantity:
                        raise ValidationError(
                            f"Insufficient stock for {product.name} ({variant.name})."
                        )

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
                        "inventory": inventory
                    })

                except (Product.DoesNotExist, ProductVariant.DoesNotExist):
                    raise ValidationError("Invalid product or product variant.")

            if wallet.current_balance < total_price:
                raise ValidationError("Insufficient wallet balance.")

            # Deduct from wallet
            wallet.current_balance = F('current_balance') - total_price
            wallet.save()

            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='DEBIT',
                amount=total_price,
                description="Payment for admin bulk order",
                transaction_status='SUCCESS'
            )

            # Find admin user as seller
            admin_user = User.objects.filter(role='admin').first()
            if not admin_user:
                raise ValidationError("No admin user found to process the order.")

            # Create order
            order = Order.objects.create(
                buyer=buyer,
                seller=admin_user,
                total_price=total_price,
                status='pending',
                description="Order placed from admin catalog"
            )

            create_notification(
                user=buyer,
                title="Order Placed Successfully",
                message=f"Your order #{order.id} has been placed successfully!",
                notification_type="order",
                related_url=f"/orders/{order.id}/"
            )

            OrderHistory.objects.create(
                order=order,
                actor=buyer,
                action='pending',
                notes="Order from admin catalog."
            )

            # Create order items and update inventory
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
                        product=item["product"],
                        user=admin_user,
                        role='admin'
                    ).first()
                )

                # Update inventory
                inventory = item["inventory"]
                inventory.total_quantity = F('total_quantity') - item["quantity"]
                inventory.save()

                # Create inventory transaction
                from products.models import StockInventory
                StockInventory.objects.create(
                    product=item["product"],
                    variant=item["variant"],
                    user=admin_user,
                    new_quantity=-item["quantity"],
                    note=f"Order #{order.id} - Sold to {buyer.username}"
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