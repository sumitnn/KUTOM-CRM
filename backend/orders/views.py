from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import *
from .serializers import *
from django.utils.timezone import now
from accounts.permissions import IsAdminRole, IsStockistRole, IsVendorRole, IsAdminOrVendorRole, IsAdminStockistResellerRole,IsAdminOrStockistRole,IsStockistOrResellerRole,IsAdminOrResellerRole,IsResellerRole
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.generics import ListAPIView
from django.db.models import Count
from django.db.models.functions import TruncMonth
from django.db import transaction
from decimal import Decimal
from .services import OrderService
from rest_framework.exceptions import ValidationError
import csv
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from django.db.models import Sum, Count
import pandas as pd
from datetime import timedelta, datetime
from io import StringIO
from django.utils.text import get_valid_filename
from accounts.utils import create_notification
from rest_framework.parsers import MultiPartParser, FormParser
from products.models import Product, ProductVariant, ProductVariantPrice, RoleBasedProduct
from django.shortcuts import get_object_or_404
from accounts.models import User, Wallet, WalletTransaction, Notification
from products.models import StockInventory,ProductCommission
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from django.core.paginator import Paginator
from rest_framework.decorators import api_view, permission_classes
from accounts.utils import send_email_to_user
from decimal import Decimal
from django.core.exceptions import ObjectDoesNotExist


class CreateOrderAPIView(generics.CreateAPIView):
    serializer_class = OrderCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if request.user.role != 'reseller':
            raise permissions.PermissionDenied("Only resellers can create orders.")
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            order = serializer.save(buyer=request.user)
            
            # Create order history
            OrderHistory.objects.create(
                order=order,
                actor=request.user,
                action='pending',
                notes='Order created by reseller'
            )
            
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyOrdersPagination(PageNumberPagination):
    page_size = 10

class MyOrdersView(ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MyOrdersPagination

    def get_queryset(self):
        user = self.request.user
        if user.role =="admin":
            queryset = Order.objects.filter(Q(buyer=user))
        else:
            queryset = Order.objects.filter(Q(buyer=user) | Q(seller=user))

        status_filter = self.request.query_params.get('status')
        if status_filter:
            if status_filter == "received":
                queryset = queryset.filter(status__in=['delivered', 'received'])
            elif status_filter == "all":
                pass  # Return all orders
            elif status_filter == "new":
                queryset = queryset.filter(status="pending")
            else:
                queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-created_at')


class VendorOrdersView(ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminOrVendorRole]
    pagination_class = MyOrdersPagination

    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.filter(seller=user)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            if status_filter == "new":
                queryset = queryset.filter(status="pending")
            elif status_filter == "delivered":
                queryset = queryset.filter(status='delivered')
            elif status_filter == "received":
                queryset = queryset.filter(status='delivered')
            else:
                queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        # Get the main queryset for the current status filter
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get paginated data
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated_data = self.get_paginated_response(serializer.data)
            data = paginated_data.data
        else:
            serializer = self.get_serializer(queryset, many=True)
            data = serializer.data

        # Get counts for all status tabs
        user = self.request.user
        status_counts = Order.objects.filter(seller=user).aggregate(
            new=Count('id', filter=Q(status='pending')),
            accepted=Count('id', filter=Q(status='accepted')),
            rejected=Count('id', filter=Q(status='rejected')),
            cancelled=Count('id', filter=Q(status='cancelled')),
            dispatched=Count('id', filter=Q(status='dispatched')),
            delivered=Count('id', filter=Q(status='delivered'))
        )

        # Add counts to response
        data['status_counts'] = status_counts
        
        return Response(data)


class BulkOrderCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        items_data = data.get("items", [])

        if not isinstance(items_data, list) or not items_data:
            return Response({"message": "Invalid or empty 'items' list."}, status=400)

        try:
            if request.user.role != "admin":
                return Response({"message": "You don't have access to order items."}, status=400)

            # Validate all items first before processing
            validation_errors = self._validate_items(items_data)
            if validation_errors:
                return Response({"message": validation_errors}, status=400)

            # Create single order with multiple items
            order, total_price, items_count = OrderService.create_bulk_order(request.user, items_data)

            return Response({
                "message": "Order created successfully with multiple items.",
                "order_id": order.id,
                "total_items": items_count,
                "total_deducted": total_price
            }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({"message": str(e)}, status=400)
        except Exception as e:
            return Response({"message": str(e)}, status=400)

    def _validate_items(self, items_data):
        """Validate all items before processing"""
        errors = []
        
        for index, item in enumerate(items_data):
            product_id = item.get("product_id")
            variant_id = item.get("variant_id")
            quantity = item.get("quantity", 0)
            
            if not product_id or quantity <= 0:
                errors.append(f"Item {index + 1}: Invalid product_id or quantity")
                continue
            
            try:
                product = Product.objects.get(id=product_id)
                seller = product.owner
                
                # Check stock
                stock_inv = StockInventory.objects.filter(
                    user=seller,
                    product_id=product_id,
                    variant_id=variant_id
                ).first()
                
                if not stock_inv:
                    errors.append(f"Item {index + 1}: No stock found for product {product.name}")
                elif stock_inv.total_quantity < quantity:
                    # Create low stock notification
                    create_notification(
                        user=seller,
                        title="Low Stock Alert",
                        message=(
                            f"Your product '{product.name}' (variant id: {variant_id}) "
                            f"stock is low ({stock_inv.total_quantity} left). "
                            "Please restock soon to avoid missed orders."
                        ),
                        notification_type="stock",
                        related_url=f"/inventory/{stock_inv.id}/"
                    )
                    errors.append(
                        f"Item {index + 1}: Insufficient stock for {product.name}. "
                        f"Available: {stock_inv.total_quantity}, Requested: {quantity}"
                    )
                        
            except Product.DoesNotExist:
                errors.append(f"Item {index + 1}: Product with ID {product_id} not found")
        
        return "; ".join(errors) if errors else None



class AdminOrderListView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        filter_type = request.query_params.get('filter', 'today')
        search_term = request.query_params.get('search', '')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        today = timezone.now().date()

        # Base queryset: orders where user is the seller
        base_qs = Order.objects.filter(seller=request.user)

        # Apply filter type
        if filter_type == 'today':
            orders = base_qs.filter(created_at__date=today)
        elif filter_type != 'all':
            orders = base_qs.filter(status=filter_type)
        else:
            orders = base_qs

        # Search filter
        if search_term:
            search_q = (
                Q(id__icontains=search_term) |
                Q(buyer__username__icontains=search_term) |
                Q(buyer__email__icontains=search_term) |
                Q(seller__username__icontains=search_term) |
                Q(seller__email__icontains=search_term)
            )
            orders = orders.filter(search_q)

        # Date range filter
        if start_date and end_date:
            orders = orders.filter(
                created_at__date__gte=start_date,
                created_at__date__lte=end_date
            )

        # Aggregate counts
        status_counts = (
            base_qs
            .values('status')
            .annotate(count=Count('id'))
        )
        counts_dict = {status: 0 for status in [
            'pending', 'accepted', 'ready_for_dispatch', 'dispatched',
            'delivered', 'rejected', 'cancelled'
        ]}
        for item in status_counts:
            counts_dict[item['status']] = item['count']

        counts = {
            'all': base_qs.count(),
            'today': base_qs.filter(created_at__date=today).count(),
            **counts_dict
        }

        # Pagination
        paginator = PageNumberPagination()
        paginated_orders = paginator.paginate_queryset(
            orders.order_by('-created_at'), request
        )
        serializer = OrderSerializer(paginated_orders, many=True)

        response = paginator.get_paginated_response(serializer.data)
        response.data['counts'] = counts
        return response


class OrderDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = Order.objects.prefetch_related(
                'items__product',
                'items__variant'
            ).get(id=order_id)
            
            # Check permissions
            if not (request.user == order.buyer or request.user == order.seller or request.user.role =="admin"):
                return Response(
                    {"detail": "You do not have permission to view this order."},
                    status=status.HTTP_403_FORBIDDEN
                )

        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderDetailSerializer(order, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CancelOrderAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)
        

        if order.status != 'pending':
            return Response(
                {"detail": "Only pending orders can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.user != order.buyer and not request.user.is_staff:
            return Response(
                {"detail": "You don't have permission to cancel this order."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Revert stock quantities
        for item in order.items.all():  # Assuming order has a related_name 'items'
            try:
                stock_inv = StockInventory.objects.get(
                    user=order.seller,  # stock belongs to seller
                    product=item.product,
                    variant=getattr(item, 'variant', None)
                )
                # Add back the quantity
                stock_inv.adjust_stock(
                    change_quantity=item.quantity,
                    action="RETURN",
                    reference_id=order.id
                )
            except StockInventory.DoesNotExist:
                # Optionally: create stock if missing
                StockInventory.objects.create(
                    user=order.seller,
                    product=item.product,
                    variant=getattr(item, 'variant', None),
                    total_quantity=item.quantity,
                    notes=f"Restocked due to cancellation of order {order.id}"
                )

        # Create order history
        OrderHistory.objects.create(
            order=order,
            actor=request.user,
            action='cancelled',
            notes=request.data.get('note', 'Order cancelled by customer'),
            previous_status=order.status
        )

        # Update order status
        order.status = 'cancelled'
        order.save()

        serializer = OrderDetailSerializer(order, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class UpdateOrderStatusView(APIView):
    permission_classes = [IsAdminOrVendorRole]

    def patch(self, request, pk):
        
        try:
            order = Order.objects.select_related('buyer', 'seller').prefetch_related('items').get(pk=pk)
        except Order.DoesNotExist:
            return Response({"message": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # Check permissions
        if request.user != order.seller and request.user != order.buyer:
            return Response({"message": "You are not authorized to update this order."}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        if not new_status:
            return Response({"message": "Status field is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Normalize status
        if new_status == "received":
            new_status = "delivered"
        
        note = request.data.get('note', '')

        try:
            with transaction.atomic():
                return self._process_order_status_update(order, request.user, new_status, note)
                
        except Exception as e:
            print(e)
            return Response(
                {"message": "An error occurred while updating order status."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _process_order_status_update(self, order, user, new_status, note):
        """Process order status update within transaction"""
        previous_status = order.status
        
        

        if new_status == 'cancelled':
            self._handle_cancelled_order(order, user)

        # Update order status
        order.status = new_status
        if new_status != 'cancelled':
            order.note = note
        order.save()

        # Create history record
        OrderHistory.objects.create(
            order=order,
            actor=user,
            action=new_status,
            notes=order.note,
            previous_status=previous_status
        )

        # Handle specific status transitions
        if new_status == 'delivered':
            self._handle_delivered_and_accepted_status(order, user)


        # Create notifications
        self._create_status_notifications(order, new_status, user)

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _handle_delivered_and_accepted_status(self, order, user):
        """
        Combined handler for delivered status that includes:
        - Payment processing (from accepted status)
        - Transport charges handling
        - Role-based product setup
        - Stock inventory setup
        """
        try:
            # 1️⃣ PROCESS PAYMENT TO SELLER (from _handle_accepted_status)
            self._process_seller_payment(order)
            
            # 2️⃣ PROCESS TRANSPORT CHARGES
            self._process_transport_charges(order)
            
            # 3️⃣ SETUP BUYER PRODUCTS AND STOCK
            self._setup_buyer_products_and_stock(order)
            
            # 4️⃣ CREATE COMBINED NOTIFICATIONS
            self._create_delivered_status_notifications(order)
            
        except Exception as e:
            print(e)
            # Don't raise here to avoid breaking the main transaction for non-critical errors

    def _process_seller_payment(self, order):
        """Process payment to seller (previously in _handle_accepted_status)"""
        
        try:
            seller_wallet, _ = Wallet.objects.get_or_create(user=order.seller)
            order_amount = order.total_price

            seller_wallet.current_balance += order_amount
            seller_wallet.save()

            # Create seller CREDIT transaction
            WalletTransaction.objects.create(
                wallet=seller_wallet,
                transaction_type="CREDIT",
                amount=order_amount,
                description=f"Received payment for Order #{order.id}",
                transaction_status="SUCCESS",
                order_id=order.id,
            )

            # Update payment status
            if order.payment_status != "paid":  # Only update if not already paid
                order.payment_status = "paid"
                order.save(update_fields=["payment_status"])

        except Exception as e:
            print(e)
            # Set payment status to failed but don't break the entire delivery process
            order.payment_status = "failed"
            order.save(update_fields=["payment_status"])

    def _process_transport_charges(self, order):
        """Process transport charges payment"""
        
        if not order.transport_charges or order.transport_charges <= 0:
            return

        try:
            buyer_wallet, _ = Wallet.objects.get_or_create(user=order.buyer)
            seller_wallet, _ = Wallet.objects.get_or_create(user=order.seller)

            transport_charges = order.transport_charges
            
            if buyer_wallet.current_balance >= transport_charges:
                # Deduct from buyer
                buyer_wallet.current_balance -= transport_charges
                buyer_wallet.save()

                # Credit to seller (additional to order amount)
                seller_wallet.current_balance += transport_charges
                seller_wallet.save()

                # Create transactions
                WalletTransaction.objects.create(
                    wallet=buyer_wallet,
                    transaction_type='DEBIT',
                    amount=transport_charges,
                    description=f"Transport charges for Order #{order.id}",
                    transaction_status='SUCCESS',
                    order_id=order.id,
                    user_id=order.seller.unique_role_id
                )
                WalletTransaction.objects.create(
                    wallet=seller_wallet,
                    transaction_type='CREDIT',
                    amount=transport_charges,
                    description=f"Received transport charges for Order #{order.id}",
                    transaction_status='SUCCESS',
                    order_id=order.id,
                    user_id=order.buyer.unique_role_id
                )
                
                # Update payment status for transport charges
                order.payment_status = "paid"
            else:
                # Insufficient balance
                WalletTransaction.objects.create(
                    wallet=buyer_wallet,
                    transaction_type='DEBIT',
                    amount=transport_charges,
                    description=f"Transport charges for Order #{order.id} (FAILED - insufficient balance)",
                    transaction_status='FAILED',
                    order_id=order.id
                )
                order.payment_status = "failed"
                
            order.save(update_fields=["payment_status"])
            
        except Exception as e:
            print(e)
            order.payment_status = "failed"
            order.save(update_fields=["payment_status"])

    def _setup_buyer_products_and_stock(self, order):
        """Setup RoleBasedProduct, VariantPrice, and StockInventory for buyer"""
        for item in order.items.all():
            try:
                product = item.product
                variant = getattr(item, "variant", None)
                buyer = order.buyer

                # Determine role
                role = self._get_user_role(buyer)

                # Create/update RoleBasedProduct
                self._setup_role_based_product(product, buyer, role, variant)
                
                # Create/update ProductVariantPrice if variant exists
                if variant:
                    self._setup_product_variant_price(product, variant, buyer, role, item)

                # Setup stock inventory
                self._setup_stock_inventory(product, variant, buyer, item, order.id)
                
            except Exception as e:
                print(e)
                continue  # Continue with other items

    def _create_delivered_status_notifications(self, order):
        """Create combined notifications for delivered status"""
        order_amount = order.total_price
        transport_charges = order.transport_charges or 0
        
        # Notification for buyer
        buyer_message = f"Your order #{order.id} has been delivered."
        if order_amount > 0:
            buyer_message += f" Payment of {order_amount} has been processed."
        if transport_charges > 0:
            if order.payment_status == "paid":
                buyer_message += f" Transport charges of {transport_charges} have been paid."
            else:
                buyer_message += f" Transport charges of {transport_charges} failed. Please update your wallet."
        
        create_notification(
            user=order.buyer,
            title="Order Delivered",
            message=buyer_message,
            notification_type="order_delivered",
            related_url=f"/orders/{order.id}/"
        )

        # Notification for seller
        seller_message = f"Order #{order.id} has been delivered to customer."
        if order_amount > 0:
            seller_message += f" Amount {order_amount} has been credited to your wallet."
        if transport_charges > 0 and order.payment_status == "paid":
            seller_message += f" Transport charges of {transport_charges} received."
        
        create_notification(
            user=order.seller,
            title="Order Delivered",
            message=seller_message,
            notification_type="order_delivered",
            related_url=f"/orders/{order.id}/"
        )

    # Keep all other methods the same as previous version
    def _handle_cancelled_order(self, order, user):
        """Handle order cancellation with stock revert and refund"""
        try:
            # 1️⃣ Revert stock to seller
            self._revert_stock_to_seller(order)
            
            # 2️⃣ Refund buyer wallet
            self._refund_buyer_wallet(order)
            
            # Update order payment status
            order.payment_status = "refunded"
            order.note = "Order cancelled by customer"

            # 3️⃣ Notifications
            self._create_cancellation_notifications(order)

        except Exception as e:
            print(e)
            raise

    def _revert_stock_to_seller(self, order):
        """Revert stock items to seller inventory"""
        for item in order.items.all():
            try:
                stock_inv = StockInventory.objects.get(
                    user=order.seller,
                    product=item.product,
                    variant=getattr(item, 'variant', None)
                )
                stock_inv.adjust_stock(
                    change_quantity=item.quantity,
                    action="RETURN",
                    reference_id=order.id
                )
            except StockInventory.DoesNotExist:
                # Create stock if missing
                StockInventory.objects.create(
                    user=order.seller,
                    product=item.product,
                    variant=getattr(item, 'variant', None),
                    total_quantity=item.quantity,
                    notes=f"Restocked due to order cancellation #{order.id}"
                )

    def _refund_buyer_wallet(self, order):
        """Refund amount to buyer's wallet"""
        try:
            buyer_wallet, _ = Wallet.objects.get_or_create(user=order.buyer)
            buyer_wallet.current_balance += order.total_price
            buyer_wallet.save()

            WalletTransaction.objects.create(
                wallet=buyer_wallet,
                transaction_type='CREDIT',
                amount=order.total_price,
                description=f"Refund for cancelled Order #{order.id}",
                transaction_status='SUCCESS',
                order_id=order.id,
                user_id=order.buyer.unique_role_id
            )
        except Exception as e:
            print(e)
            raise

    def _get_user_role(self, user):
        """Determine user role from profile"""
        if hasattr(user, "profile"):
            if user.stockist_id:
                return "stockist"
            elif user.reseller_id:
                return "reseller"
        return "admin"

    def _setup_role_based_product(self, product, user, role, variant):
        """Setup RoleBasedProduct for user"""
        rbp, created = RoleBasedProduct.objects.get_or_create(
            product=product,
            user=user,
            role=role,
            defaults={"price": getattr(product, "base_price", None)}
        )
        
        # Attach variant if missing
        if variant and variant not in rbp.variants.all():
            rbp.variants.add(variant)

    def _setup_product_variant_price(self, product, variant, user, role, item):
        """Setup ProductVariantPrice"""
        pvp, created = ProductVariantPrice.objects.get_or_create(
            product=product,
            variant=variant,
            user=user,
            role=role,
            actual_price=item.single_quantity_after_gst_and_discount_price,  
            defaults={
                "price": item.single_quantity_after_gst_and_discount_price,
                "discount": 0,
                "gst_percentage": 0
            }
        )

        if not created:
            # Update price only if it changed
            if pvp.price != item.single_quantity_after_gst_and_discount_price:
                pvp.price = item.single_quantity_after_gst_and_discount_price
                pvp.save()
    def _setup_stock_inventory(self, product, variant, user, item, order_id):
        """Setup or update stock inventory"""
        stock_inv, created = StockInventory.objects.get_or_create(
            user=user,
            product=product,
            variant=variant,
            batch_number=item.batch_number,
            defaults={
                "total_quantity": item.quantity,
                "notes": f"Initial stock from Order #{order_id}",
                "manufacture_date": item.manufacture_date,
                "expiry_date": item.expiry_date,
            }
        )
        
        
        stock_inv.adjust_stock(
                change_quantity=item.quantity,
                action="ADD",
                reference_id=order_id
            )
       



    def _create_accepted_status_notifications(self, order):
        """Create notifications for accepted status"""
        create_notification(
            user=order.seller,
            title="Order Accepted",
            message=f"You have received {order.total_price} for Order #{order.id}.",
            notification_type="order_accepted",
            related_url=f"/orders/{order.id}/",
        )
        create_notification(
            user=order.buyer,
            title="Order Accepted",
            message=f"Your order #{order.id} has been accepted by the seller.",
            notification_type="order_accepted",
            related_url=f"/orders/{order.id}/",
        )

    def _create_cancellation_notifications(self, order):
        """Create notifications for order cancellation"""
        create_notification(
            user=order.buyer,
            title="Order Cancelled & Refunded",
            message=f"Your order #{order.id} has been cancelled and amount refunded to your wallet.",
            notification_type="order_cancelled_refund",
            related_url=f"/orders/{order.id}/"
        )

        create_notification(
            user=order.seller,
            title="Order Cancelled",
            message=f"Order #{order.id} has been cancelled by the customer. Stock has been added back to your inventory.",
            notification_type="order_cancelled_stock",
            related_url=f"/orders/{order.id}/"
        )

    def _create_status_notifications(self, order, new_status, current_user):
        """Create notifications for order status updates"""
        if current_user != order.buyer:
            create_notification(
                user=order.buyer,
                title="Order Status Updated",
                message=f"Your order #{order.id} status has been updated to {new_status}.",
                notification_type="order_status_update",
                related_url=f"/orders/{order.id}/"
            )

        if current_user != order.seller:
            create_notification(
                user=order.seller,
                title="Order Status Updated",
                message=f"Order #{order.id} status has been updated to {new_status}.",
                notification_type="order_status_update",
                related_url=f"/orders/{order.id}/"
            )


class UpdateOrderDispatchStatusView(APIView):
    permission_classes = [IsAdminOrVendorRole]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request, pk):
      
        try:
            order = Order.objects.get(id=pk)
        except Order.DoesNotExist:
            return Response({"message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check permissions - only seller can update dispatch info
        if request.user != order.seller:
            return Response(
                {"message": "You are not allowed to update this order."},
                status=status.HTTP_403_FORBIDDEN
            )

        tracking_number = request.data.get('tracking_id')

        # Check if tracking number already exists (excluding this order)
        if tracking_number and Order.objects.exclude(id=order.id).filter(tracking_number=tracking_number).exists():
            return Response(
                {"message": "Tracking number already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        dispatch_info = {
            'courier_name': request.data.get('courier_name'),
            'tracking_number': tracking_number,
            'transport_charges': request.data.get('transport_charges'),
            'expected_delivery_date': request.data.get('delivery_date'),
            'status': 'dispatched',
            'note': request.data.get('note', '')
        }

        if 'receipt' in request.FILES:
            dispatch_info['receipt'] = request.FILES['receipt']

        serializer = OrderDispatchSerializer(order, data=dispatch_info, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Create history record
            OrderHistory.objects.create(
                order=order,
                actor=request.user,
                action='dispatched',
                notes=f'Order dispatched with tracking number: {tracking_number}'
            )
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderHistoryListAPIView(generics.ListAPIView):
    serializer_class = OrderHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = {
        'action': ['exact'],
        'timestamp': ['gte', 'lte'],
        'actor__id': ['exact'],
    }
    ordering_fields = ['timestamp', 'action']
    ordering = ['-timestamp']

    def get_queryset(self):
        user = self.request.user
        # Users can only see history of their own orders
        return OrderHistory.objects.filter(
            Q(order__buyer=user) | Q(order__seller=user)
        ).select_related('order', 'actor')


class OrderSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        orders = Order.objects.filter(buyer=user)

        status_counts = orders.values('status').annotate(count=Count('id'))
        status_dict = {'All': orders.count()}
        for entry in status_counts:
            status_dict[entry['status']] = entry['count']

        monthly_data = (
            orders
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        labels = [entry['month'].strftime('%b %Y') for entry in monthly_data]
        data = [entry['count'] for entry in monthly_data]

        return Response({
            'statusCounts': status_dict,
            'monthlyOrders': {
                'labels': labels,
                'data': data,
            }
        })


class SalesReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        range_filter = request.query_params.get('range', 'last_3_days')  # Default to last 3 days
        search_term = request.query_params.get('search', '')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        # Date filtering with last 3 days as default
        today = now().date()
        if start_date and end_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format'}, status=400)
        else:
            if range_filter == 'today':
                start_date = today
                end_date = today
            elif range_filter == 'last_3_days':
                start_date = today - timedelta(days=2)  # Last 3 days including today
                end_date = today
            elif range_filter == 'this_week':
                start_date = today - timedelta(days=6)  # Last 7 days
                end_date = today
            elif range_filter == 'last_month':
                start_date = today - timedelta(days=30)
                end_date = today
            else:  # Default to last 3 days
                start_date = today - timedelta(days=2)
                end_date = today

       
        orders = Order.objects.filter(
            seller=user, 
            status='delivered',
            created_at__date__range=(start_date, end_date)
        ).select_related('buyer').prefetch_related('items__product', 'items__variant')

        # Calculate sales data from order items
        sales_data = []
        total_sales = Decimal('0.00')
        total_quantity = 0
        total_orders = orders.count()

        for order in orders:
            for item in order.items.all():
                product_image = None
                if item.product and item.product.images.exists():
                    product_image = item.product.images.first().image.url
                
                sales_data.append({
                    'id': f"{order.id}-{item.id}",
                    'order_date': order.created_at,
                    'product_name': item.product.name if item.product else 'N/A',
                    'product_image': product_image,
                    'variant_name': item.variant.name if item.variant else '-',
                    'quantity': item.quantity,
                    'unit_price': item.single_quantity_after_gst_and_discount_price,
                    'total_price': item.final_price,
                    'order_id': order.id
                })
                total_sales += item.final_price
                total_quantity += item.quantity

        # Search filtering
        if search_term:
            sales_data = [sale for sale in sales_data if search_term.lower() in sale['product_name'].lower()]

        # Get daily sales data for line chart
        daily_sales = {}
        for sale in sales_data:
            date_str = sale['order_date'].strftime('%Y-%m-%d')
            if date_str not in daily_sales:
                daily_sales[date_str] = Decimal('0.00')
            daily_sales[date_str] += sale['total_price']

        daily_sales_list = [{
            'sale_date__date': date,
            'daily_total': float(total)
        } for date, total in sorted(daily_sales.items())]

        # Get top products for bar chart (top 10)
        product_sales = {}
        for sale in sales_data:
            product_key = sale['product_name']
            if product_key not in product_sales:
                product_sales[product_key] = Decimal('0.00')
            product_sales[product_key] += sale['total_price']

        top_products = [{
            'product__name': product,
            'product_total': float(total)
        } for product, total in sorted(
            product_sales.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:10]]

        summary_stats = {
            'total_sales': float(total_sales),
            'total_quantity': total_quantity,
            'total_orders': total_orders
        }

        response_data = {
            'sales': sales_data,
            'summary': summary_stats,
            'charts': {
                'daily_sales': daily_sales_list,
                'top_products': top_products
            },
            'filters': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'range': range_filter
            }
        }

        return Response(response_data)

class SalesExportCSVView(APIView):
    permission_classes = [IsAdminOrVendorRole]

    def get(self, request):
        try:
            user = request.user
            range_filter = request.query_params.get('range', 'last_3_days')
            search_term = request.query_params.get('search', '')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')

            # Date filtering (same logic as VendorSalesReportView)
            today = now().date()
            if start_date and end_date:
                try:
                    start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                    end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                except ValueError:
                    return Response({'error': 'Invalid date format'}, status=400)
            else:
                if range_filter == 'today':
                    start_date = today
                    end_date = today
                elif range_filter == 'last_3_days':
                    start_date = today - timedelta(days=2)
                    end_date = today
                elif range_filter == 'this_week':
                    start_date = today - timedelta(days=6)
                    end_date = today
                elif range_filter == 'last_month':
                    start_date = today - timedelta(days=30)
                    end_date = today
                else:
                    start_date = today - timedelta(days=2)
                    end_date = today

            # Get orders and prepare data
            orders = Order.objects.filter(
                seller=user, 
                status='delivered',
                created_at__date__range=(start_date, end_date)
            ).prefetch_related('items__product', 'items__variant')

            sales_data = []
            for order in orders:
                for item in order.items.all():
                    sales_data.append({
                        'order_date': order.created_at.strftime('%Y-%m-%d %H:%M'),
                        'product_name': item.product.name if item.product else 'N/A',
                        'variant_name': item.variant.name if item.variant else 'N/A',
                        'quantity': item.quantity,
                        'unit_price': str(item.single_quantity_after_gst_and_discount_price),
                        'total_price': str(item.final_price),
                        'order_id': order.id
                    })

            # Search filtering
            if search_term:
                sales_data = [sale for sale in sales_data if search_term.lower() in sale['product_name'].lower()]

            # Create CSV response
            response = HttpResponse(content_type='text/csv')
            filename = f"sales_report_{start_date}_to_{end_date}.csv"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            writer = csv.writer(response)
            writer.writerow(['Order Date', 'Product', 'Variant', 'Quantity', 'Unit Price', 'Total Price', 'Order ID'])

            for sale in sales_data:
                writer.writerow([
                    sale['order_date'],
                    sale['product_name'],
                    sale['variant_name'],
                    sale['quantity'],
                    sale['unit_price'],
                    sale['total_price'],
                    sale['order_id']
                ])

            return response

        except Exception as e:
            return Response({'error': f'Failed to generate report: {str(e)}'}, status=500)


class StockistOrderManagementView(APIView):
    permission_classes = [IsStockistRole]

    def get(self, request):
        """Get orders assigned to stockist"""
        status_filter = request.query_params.get('status', 'pending')
        
        orders = Order.objects.filter(
            seller=request.user,
            status=status_filter
        ).order_by('-created_at')
        
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    def patch(self, request, order_id):
        """Update order status (accept/reject)"""
        order = get_object_or_404(Order, id=order_id, seller=request.user)
        
        new_status = request.data.get('status')
        if new_status not in ['accepted', 'rejected']:
            return Response(
                {"detail": "Invalid status. Use 'accepted' or 'rejected'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        order.save()

        # Create history record
        OrderHistory.objects.create(
            order=order,
            actor=request.user,
            action=new_status,
            notes=request.data.get('note', '')
        )

        # Notify buyer
        create_notification(
            user=order.buyer,
            title=f"Order {new_status.capitalize()}",
            message=f"Your order #{order.id} has been {new_status} by the stockist.",
            notification_type="order_status_update",
            related_url=f"/orders/{order.id}/"
        )

        serializer = OrderSerializer(order)
        return Response(serializer.data)


class OrderRequestListCreateView(APIView):
    permission_classes = [IsAdminOrStockistRole]

    def get(self, request):
        user = request.user
        queryset = (
            OrderRequest.objects
            .select_related('requested_by', 'target_user')
            .prefetch_related('items')
        )

        # Filters
        status_param = request.query_params.get("status")
        email = request.query_params.get("user_email")

        if status_param:
            queryset = queryset.filter(status=status_param)
        if email:
            queryset = queryset.filter(requested_by__email__icontains=email)

        # Admins see all; others see only their requests
        if not user.role=="admin":
            queryset = queryset.filter(requested_by=user)

        serializer = OrderRequestSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
      
        serializer = OrderRequestSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            order_request = serializer.save()
            self._notify_admin(order_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _notify_admin(self, order_request):
        admin_user = User.objects.filter(role="admin").first()
        if admin_user:
            Notification.objects.create(
                user=admin_user,
                title="New Order Request",
                message=f"New order request {order_request.request_id} from {order_request.requested_by.email}",
                notification_type="order_request",
            )
            send_email_to_user(admin_user.email,f"New Order Request Recieved From Stockist",f"New Order Request Recieved {order_request.request_id} from {order_request.requested_by.email}")


# Order Request Detail, Update, Delete
class OrderRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminOrStockistRole]
    serializer_class = OrderRequestDetailSerializer
    queryset = OrderRequest.objects.select_related('requested_by', 'target_user').prefetch_related('items')

    def get_queryset(self):
        user = self.request.user
        if user.role=="admin":
            return self.queryset
        return self.queryset.filter(requested_by=user)

    def perform_update(self, serializer):
        # Only allow status updates via update_status endpoint
        if 'status' in serializer.validated_data:
            raise serializers.ValidationError({"error": "Use update_status endpoint to change status"})
        serializer.save()

# Update Status Endpoint
@api_view(['POST'])
@permission_classes([IsAdminOrStockistRole])
def update_order_request_status(request, pk):
  
    try:
        order_request = OrderRequest.objects.get(pk=pk)
    except OrderRequest.DoesNotExist:
        return Response({"error": "Order request not found"}, status=404)
    
    # Check permissions
    if not request.user.role=="admin" and order_request.requested_by != request.user:
        return Response({"error": "Permission denied"}, status=403)
    
    serializer = OrderRequestStatusSerializer(order_request, data=request.data)
    if serializer.is_valid():
        new_status = serializer.validated_data['status']
        old_status = order_request.status
        
        # Validate status change
        if not request.user.role =="admin" and new_status == 'cancelled':
            if old_status != 'pending':
                return Response({"error": "Can only cancel pending requests"}, status=400)
        elif not request.user.role == "admin":
            return Response({"error": "Only admin can update status"}, status=403)
        
        with transaction.atomic():
            order_request = serializer.save()
            _handle_status_change(order_request, old_status, new_status,order_request.requested_by, order_request.target_user)
        
        return Response(OrderRequestSerializer(order_request).data)
    
    return Response(serializer.errors, status=400)

def _handle_status_change(order_request, old_status, new_status,current_user, user):
    total_amount = sum(item.total_price for item in order_request.items.all())
    
    if new_status == 'approved' and old_status == 'pending':
        # Add amount to admin wallet
        admin_wallet, _ = Wallet.objects.get_or_create(user=user)
        admin_wallet.current_balance += total_amount
        admin_wallet.save()
        # Create refund transaction
        WalletTransaction.objects.create(
                wallet=admin_wallet,
                transaction_type='CREDIT',
                amount=total_amount,    
                description=f"Order Request {order_request.request_id} By Stockist",
                transaction_status='SUCCESS',
                is_refund=False
            )
        Notification.objects.create(
                user=current_user,
                title="Your Order Request is Approved",
                message=f"Your order request {order_request.request_id} is approved by Admin",
                notification_type="order_request",
            )
        _update_inventory(order_request)
        
        
        
    elif new_status in ['rejected', 'cancelled'] and old_status == 'pending':
        # Refund to stockist
        if order_request.requestor_type == 'stockist':
            wallet = Wallet.objects.get(user=order_request.requested_by)
            wallet.current_balance += total_amount
            wallet.save()

            # Create refund transaction
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='CREDIT',
                amount=total_amount,    
                description=f"Refund for Order Request {order_request.request_id}",
                transaction_status='SUCCESS',
                is_refund=True,
            )
            
            if new_status == 'rejected':
                Notification.objects.create(
                    user=current_user,
                    title="Your Order Request is Rejected",
                    message=f"Your order request {order_request.request_id} is rejected by Admin",
                    notification_type="order_request",
                )
            if new_status == 'cancelled':
                Notification.objects.create(
                    user=user,
                    title="Order Request is Cancelled",
                    message=f"order request {order_request.request_id} is cancelled by stockist",
                    notification_type="order_request",
                )

def _update_inventory(order_request):
    """
    Reduces stock from Admin (target_user) and adds stock to Stockist (requested_by),
    preserving batch details (batch_number, manufacture_date, expiry_date).
    """
    stockist_user = order_request.requested_by  # buyer
    target_user = order_request.target_user     # admin whose stock is reduced

    with transaction.atomic():
        for item in order_request.items.all():
            # 1️⃣ Get Admin Inventory Record (source of stock)
            try:
                admin_stock = StockInventory.objects.get(
                    product=item.product.product,
                    variant=item.variant,
                    user=target_user
                )
            except StockInventory.DoesNotExist:
                raise ValueError(
                    f"No admin stock found for product {item.product.product} (variant {item.variant})"
                )

            # Deduct quantity from admin inventory
            admin_stock.adjust_stock(
                change_quantity=-item.quantity,
                action="ORDER",
                reference_id=f"OrderReq-{order_request.id}",
            )

            # 2️⃣ Add stock to Stockist Inventory (target)
            stockist_stock, _ = StockInventory.objects.get_or_create(
                product=item.product.product,
                variant=item.variant,
                user=stockist_user,
                batch_number=admin_stock.batch_number,  # ✅ Copy batch
                defaults={
                    "total_quantity": 0,
                    "manufacture_date": admin_stock.manufacture_date,
                    "expiry_date": admin_stock.expiry_date,
                    "notes": f"Transferred from Admin Stock on {timezone.now().date()}",
                },
            )

            stockist_stock.adjust_stock(
                change_quantity=item.quantity,
                action="ADD",
                reference_id=f"OrderReq-{order_request.id}",
            )

    return True

# Get requests by status
@api_view(['GET'])
@permission_classes([IsAdminOrStockistRole])
def get_requests_by_status(request, status):
    user = request.user
    queryset = OrderRequest.objects.select_related('requested_by', 'target_user').prefetch_related('items')
    if not user.role=="admin":
        queryset = queryset.filter(requested_by=user)
    
    if user.role=="admin":
        queryset = queryset.filter(target_user=user).exclude(status='cancelled')
    
    if status=="rejected" and not user.role=="admin":
        queryset = queryset.filter(Q(status='rejected') | Q(status='cancelled'))
    else:
        queryset = queryset.filter(status=status)
    
    # Pagination
    queryset = queryset.order_by('-created_at')
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 10)
    
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    
    serializer = OrderRequestSerializer(page_obj, many=True)
    
    return Response({
        'results': serializer.data,
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': page_obj.number,
    })

# views.py
# views.py
class OrderRequestReportView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        user = request.user
        
        range_filter = request.query_params.get('range', 'last_3_days')
        search_term = request.query_params.get('search', '')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        status_filter = request.query_params.get('status', 'approved')  # Default to approved

        # Date filtering
        today = now().date()
        if start_date and end_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format'}, status=400)
        else:
            if range_filter == 'today':
                start_date = today
                end_date = today
            elif range_filter == 'last_3_days':
                start_date = today - timedelta(days=2)
                end_date = today
            elif range_filter == 'this_week':
                start_date = today - timedelta(days=6)
                end_date = today
            elif range_filter == 'last_month':
                start_date = today - timedelta(days=30)
                end_date = today
            else:
                start_date = today - timedelta(days=2)
                end_date = today

        # Get order requests - for admin: target_user=user, for vendor: requested_by=user
        if user.role in ['admin', 'super_admin']:
            # Admin sees requests where they are the target
            order_requests = OrderRequest.objects.filter(
                target_user=user,
                created_at__date__range=(start_date, end_date)
            )
        else:
            # Vendor sees their own requests
            order_requests = OrderRequest.objects.filter(
                requested_by=user,
                created_at__date__range=(start_date, end_date)
            )

        # Status filtering
        if status_filter and status_filter != 'all':
            order_requests = order_requests.filter(status=status_filter)

        # Search filtering
        if search_term:
            order_requests = order_requests.filter(
                Q(request_id__icontains=search_term) |
                Q(requested_by__email__icontains=search_term) |
                Q(requested_by__username__icontains=search_term) |
                Q(note__icontains=search_term)
            )

        # Prefetch related items to avoid N+1 queries
        order_requests = order_requests.select_related('requested_by', 'target_user').prefetch_related('items').order_by('-created_at')

        # Prepare order request data
        order_requests_data = []
        total_requests = order_requests.count()
        total_sales_amount = 0
        total_items_quantity = 0
        
        status_counts = {
            'pending': 0,
            'approved': 0,
            'rejected': 0,
            'cancelled': 0
        }

        # Calculate sales amount by status
        sales_by_status = {
            'pending': 0,
            'approved': 0,
            'rejected': 0,
            'cancelled': 0
        }

        for req in order_requests:
            req_total_amount = req.total_amount
            req_total_quantity = req.total_quantity
            
            total_sales_amount += req_total_amount
            total_items_quantity += req_total_quantity
            
            status_counts[req.status] += 1
            sales_by_status[req.status] += req_total_amount
            
            # Get items details
            items_data = []
            for item in req.items.all():
                items_data.append({
                    'product_name': item.product.product.name,
                    'variant': item.variant.name if item.variant else 'No Variant',
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'total_price': float(item.total_price),
                    'gst_percentage': float(item.gst_percentage),
                    'discount_percentage': float(item.discount_percentage)
                })
            
            order_requests_data.append({
                'id': req.id,
                'request_id': req.request_id,
                'requested_by': {
                    'id': req.requested_by.id,
                    'name': req.requested_by.username or req.requested_by.email,
                    'email': req.requested_by.email
                },
                'target_user': {
                    'id': req.target_user.id if req.target_user else None,
                    'name': req.target_user.username if req.target_user else 'System',
                    'email': req.target_user.email if req.target_user else None
                } if req.target_user else None,
                'requestor_type': req.requestor_type,
                'target_type': req.target_type,
                'status': req.status,
                'note': req.note,
                'total_amount': float(req_total_amount),
                'total_quantity': req_total_quantity,
                'items': items_data,
                'created_at': req.created_at,
                'updated_at': req.updated_at
            })

        # Get daily requests data for line chart (including sales amount)
        daily_requests = {}
        daily_sales = {}
        for req in order_requests:
            date_str = req.created_at.strftime('%Y-%m-%d')
            if date_str not in daily_requests:
                daily_requests[date_str] = 0
                daily_sales[date_str] = 0
            daily_requests[date_str] += 1
            daily_sales[date_str] += float(req.total_amount)

        daily_requests_list = [{
            'request_date': date,
            'daily_count': count,
            'daily_sales': daily_sales[date]
        } for date, count in sorted(daily_requests.items())]

        # Get status distribution for pie chart (including sales amount)
        status_distribution = [{
            'status': status,
            'count': count,
            'sales_amount': sales_by_status[status]
        } for status, count in status_counts.items() if count > 0]

        summary_stats = {
            'total_requests': total_requests,
            'total_sales_amount': float(total_sales_amount),
            'total_items_quantity': total_items_quantity,
            'average_order_value': round(float(total_sales_amount / total_requests) if total_requests > 0 else 0, 2),
            'status_counts': status_counts,
            'sales_by_status': sales_by_status,
            'approval_rate': round((status_counts['approved'] / total_requests * 100) if total_requests > 0 else 0, 1)
        }

        response_data = {
            'order_requests': order_requests_data,
            'summary': summary_stats,
            'charts': {
                'daily_requests': daily_requests_list,
                'status_distribution': status_distribution
            },
            'filters': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'range': range_filter,
                'status': status_filter
            }
        }

        return Response(response_data)

class OrderRequestExportCSVView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        try:
            user = request.user
            range_filter = request.query_params.get('range', 'last_3_days')
            search_term = request.query_params.get('search', '')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            status_filter = request.query_params.get('status', 'approved')

            # Date filtering (same logic as OrderRequestReportView)
            today = now().date()
            if start_date and end_date:
                try:
                    start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                    end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                except ValueError:
                    return Response({'error': 'Invalid date format'}, status=400)
            else:
                if range_filter == 'today':
                    start_date = today
                    end_date = today
                elif range_filter == 'last_3_days':
                    start_date = today - timedelta(days=2)
                    end_date = today
                elif range_filter == 'this_week':
                    start_date = today - timedelta(days=6)
                    end_date = today
                elif range_filter == 'last_month':
                    start_date = today - timedelta(days=30)
                    end_date = today
                else:
                    start_date = today - timedelta(days=2)
                    end_date = today

            # Get order requests with prefetch for items
            if user.role in ['admin', 'super_admin']:
                order_requests = OrderRequest.objects.filter(
                    target_user=user,
                    created_at__date__range=(start_date, end_date)
                )
            else:
                order_requests = OrderRequest.objects.filter(
                    requested_by=user,
                    created_at__date__range=(start_date, end_date)
                ).prefetch_related('items')

            if status_filter and status_filter != 'all':
                order_requests = order_requests.filter(status=status_filter)

            if search_term:
                order_requests = order_requests.filter(
                    Q(request_id__icontains=search_term) |
                    Q(requested_by__email__icontains=search_term) |
                    Q(note__icontains=search_term)
                )

            # Prefetch items to avoid N+1 queries
            order_requests = order_requests.prefetch_related('items')

            # Create CSV response
            response = HttpResponse(content_type='text/csv')
            filename = f"order_requests_report_{start_date}_to_{end_date}.csv"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            writer = csv.writer(response)
            
            # Updated headers with sales information
            writer.writerow([
                'Request ID', 
                'Request Date', 
                'Requested By', 
                'Requestor Type', 
                'Target Type', 
                'Target User', 
                'Status', 
                'Total Amount',
                'Total Quantity',
                'Items Count',
                'Notes', 
                'Last Updated'
            ])

            for req in order_requests:
                writer.writerow([
                    req.request_id,
                    req.created_at.strftime('%Y-%m-%d %H:%M'),
                    req.requested_by.username or req.requested_by.email,
                    req.get_requestor_type_display(),
                    req.get_target_type_display(),
                    req.target_user.username if req.target_user else 'System',
                    req.get_status_display(),
                    float(req.total_amount),  # Total amount
                    req.total_quantity,      # Total quantity
                    req.items.count(),       # Number of items
                    req.note or '',
                    req.updated_at.strftime('%Y-%m-%d %H:%M')
                ])

            # Add summary row
            writer.writerow([])  # Empty row
            writer.writerow(['SUMMARY'])
            writer.writerow(['Total Requests:', order_requests.count()])
            writer.writerow(['Total Sales Amount:', float(sum(req.total_amount for req in order_requests))])
            writer.writerow(['Total Items Quantity:', sum(req.total_quantity for req in order_requests)])

            return response

        except Exception as e:
            return Response({'error': f'Failed to generate report: {str(e)}'}, status=500)
        


class ResellerOrderRequestListCreateView(APIView):
    permission_classes = [IsStockistOrResellerRole]

    def get(self, request):
        user = request.user
        queryset = (
            OrderRequest.objects
            .select_related('requested_by', 'target_user')
            .prefetch_related('items')
        )

        # Filters
        status_param = request.query_params.get("status")
        email = request.query_params.get("user_email")

        if status_param:
            queryset = queryset.filter(status=status_param)
        if email:
            queryset = queryset.filter(requested_by__email__icontains=email)

        if user.role=="stockist":
            queryset = queryset.filter(target_user=user)
        
        if user.role=="reseller":
            queryset = queryset.filter(requested_by=user)

        serializer = ResellerOrderRequestSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        
        serializer = ResellerOrderRequestSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            order_request = serializer.save()
            self._notify_stockist(order_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _notify_stockist(self, order_request):
        stockist_user = (
            StockistAssignment.objects.filter(reseller=order_request.requested_by)
            .select_related("stockist")
            .last()
        )

        stockist_user = stockist_user.stockist if stockist_user else (
            User.objects.filter(role="stockist", is_default_user=True).last()
        )
        if stockist_user:
            Notification.objects.create(
                user=stockist_user,
                title="New Order Request",
                message=f"New order request {order_request.request_id} from {order_request.requested_by.email}",
                notification_type="order_request",
            )
            send_email_to_user(stockist_user.email,"New Order Request Received",f"New order request {order_request.request_id} from {order_request.requested_by.email}")

@api_view(['GET'])
@permission_classes([IsStockistOrResellerRole])
def get_reseller_order_requests_by_status(request, status):
    user = request.user
    queryset = OrderRequest.objects.select_related('requested_by', 'target_user').prefetch_related('items')
    
    if not user.role == "stockist":
        queryset = queryset.filter(requested_by=user)
    
    if user.role == "stockist":
        queryset = queryset.filter(target_user=user).exclude(status='cancelled')
    
    if status == "rejected" and not user.role == "stockist":
        queryset = queryset.filter(Q(status='rejected') | Q(status='cancelled'))
    else:
        queryset = queryset.filter(status=status)
    
    # Add ordering to fix the pagination warning
    # Order by creation date (newest first) or by ID as fallback
    queryset = queryset.order_by('-created_at', '-id')
    
    # Pagination
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 10)
    
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    
    serializer = ResellerOrderRequestSerializer(page_obj, many=True)
    
    return Response({
        'results': serializer.data,
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': page_obj.number,
    })


class ResellerOrderRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsStockistOrResellerRole]
    serializer_class = OrderRequestDetailSerializer
    queryset = OrderRequest.objects.select_related('requested_by', 'target_user').prefetch_related('items')

    def get_queryset(self):
        user = self.request.user
        if user.role=="stockist":
            return self.queryset
        return self.queryset.filter(requested_by=user)

    def perform_update(self, serializer):
        # Only allow status updates via update_status endpoint
        if 'status' in serializer.validated_data:
            raise serializers.ValidationError({"error": "Use update_status endpoint to change status"})
        serializer.save()


class UpdateOrderRequestStatusView(APIView):
    permission_classes = [IsStockistOrResellerRole]

    def post(self, request, pk):
        
        try:
            order_request = OrderRequest.objects.get(pk=pk)
        except OrderRequest.DoesNotExist:
            return Response({"error": "Order request not found"}, status=404)

        # Check permissions
        if not request.user.role == "stockist" and order_request.requested_by != request.user:
            return Response({"error": "Permission denied"}, status=403)

        serializer = OrderRequestStatusSerializer(order_request, data=request.data)
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            old_status = order_request.status

            # Validate status change
            if not request.user.role == "stockist" and new_status == 'cancelled':
                if old_status != 'pending':
                    return Response({"error": "Can only cancel pending requests"}, status=400)
            elif not request.user.role == "stockist":
                return Response({"error": "Only stockist can update status"}, status=403)

            with transaction.atomic():
                order_request = serializer.save()
                self._handle_status_change(
                    order_request,
                    old_status,
                    new_status,
                    order_request.requested_by,
                    order_request.target_user
                )

            return Response(ResellerOrderRequestSerializer(order_request).data)

        return Response(serializer.errors, status=400)

    @classmethod
    def _handle_status_change(cls, order_request, old_status, new_status, current_user, user):
        total_amount = sum(item.total_price for item in order_request.items.all())
        
        if new_status == 'approved' and old_status == 'pending':
            # Add amount to admin wallet

            admin_wallet, _ = Wallet.objects.get_or_create(user=user)
            admin_wallet.current_balance += total_amount
            admin_wallet.save()

            WalletTransaction.objects.create(
                wallet=admin_wallet,
                transaction_type='CREDIT',
                amount=total_amount,
                description=f"Order Request {order_request.request_id} By Reseller",
                transaction_status='SUCCESS',
                is_refund=False,
                user_id=order_request.requested_by.unique_role_id
            )

            Notification.objects.create(
                user=current_user,
                title="Your Order Request is Approved",
                message=f"Your order request {order_request.request_id} is approved by Stockist",
                notification_type="order_request",
            )

            cls._update_inventory(order_request)

        elif new_status in ['rejected', 'cancelled'] and old_status == 'pending':
            if order_request.requestor_type == 'reseller':
                wallet = Wallet.objects.get(user=order_request.requested_by)
                wallet.current_balance += total_amount
                wallet.save()

                WalletTransaction.objects.create(
                    wallet=wallet,
                    transaction_type='CREDIT',
                    amount=total_amount,
                    description=f"Refund for Order Request {order_request.request_id}",
                    transaction_status='SUCCESS',
                    is_refund=True,
                )

                if new_status == 'rejected':
                    Notification.objects.create(
                        user=current_user,
                        title="Your Order Request is Rejected",
                        message=f"Your order request {order_request.request_id} is rejected by Stockist",
                        notification_type="order_request",
                    )
                if new_status == 'cancelled':
                    Notification.objects.create(
                        user=user,
                        title="Order Request is Cancelled",
                        message=f"Order request {order_request.request_id} is cancelled by Reseller",
                        notification_type="order_request",
                    )

    @classmethod
    def _update_inventory(cls, order_request):
        reseller_user = order_request.requested_by  # buyer (reseller)
        target_user = order_request.target_user     # stockist 
        admin_user = User.objects.filter(role="admin").first()  # admin

        validated_items = []
        total_price = 0
        total_stockist_commission = 0  # ✅ track total commission for stockist

        with transaction.atomic():
            # ✅ Step 1: Preload all stock records
            stock_map = {
                (s.product_id, s.variant_id): s
                for s in StockInventory.objects.select_for_update().filter(
                    user=target_user,
                    product__in=[i.product.product for i in order_request.items.all()],
                    variant__in=[i.variant for i in order_request.items.all()],
                )
            }

            # ✅ Step 2: Validate, deduct, and compute commission
            for item in order_request.items.all():
                key = (item.product.product.id, item.variant.id)
                stock_record = stock_map.get(key)

                if not stock_record:
                    raise ValueError(f"No stock found for {item.product.product} - {item.variant}")

                if stock_record.total_quantity < item.quantity:
                    raise ValueError(
                        f"Not enough stock for {item.product.product} - {item.variant}. "
                        f"Available: {stock_record.total_quantity}, Requested: {item.quantity}"
                    )

                # Deduct stock
                stock_record.adjust_stock(
                    change_quantity=-item.quantity,
                    action="ORDER",
                    reference_id=f"OrderReq-{order_request.id}",
                )

                # ✅ Commission Calculation
                if target_user.role == "stockist":
                    role_product = RoleBasedProduct.objects.filter(
                        product=item.product.product,
                        user=admin_user,
                        role="admin"
                    ).first()
                else:
                    role_product = RoleBasedProduct.objects.filter(
                        product=item.product.product,
                        user=target_user,
                        role=target_user.role
                    ).first()

                commission = ProductCommission.objects.filter(
                    role_product=role_product,
                    variant=item.variant
                ).first()

                commission_amount = 0
                if commission:
                    if commission.commission_type == "flat":
                        commission_amount = commission.stockist_commission_value * item.quantity
                    elif commission.commission_type == "percent":
                        commission_amount = (
                            (commission.stockist_commission_value / 100)
                            * (item.unit_price * item.quantity)
                        )
                    total_stockist_commission += commission_amount

                validated_items.append({
                    "product": item.product.product,
                    "variant": item.variant,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "discount_percentage": item.discount_percentage,
                    "gst_percentage": item.gst_percentage,
                    "commission_amount": commission_amount,
                })

                total_price += item.unit_price * item.quantity

            # ✅ Step 3: Create the Order
            order = Order.objects.create(
                buyer=reseller_user,
                seller=admin_user,
                total_price=total_price,
                status="pending",
                description="Bulk order placed by reseller",
            )

            # ✅ Step 4: Create Order History
            OrderHistory.objects.create(
                order=order,
                actor=reseller_user,
                action="pending",
                notes="Bulk order placed.",
            )

            # ✅ Step 5: Create Order Items using .save() (triggers custom save logic)
            for item in validated_items:
                order_item = OrderItem(
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
                        role=admin_user.role
                    ).first(),
                )
                order_item.save()  # ✅ Calls your save() method

            # ✅ Step 6: Handle Stockist Commission Wallet Credit
            if total_stockist_commission > 0:
                admin_wallet, _ = Wallet.objects.get_or_create(user=admin_user)

                if admin_wallet.current_balance < total_stockist_commission:
                    raise ValueError("Admin wallet does not have enough balance to pay commission.")

                # Deduct commission from admin
                admin_wallet.current_balance -= total_stockist_commission
                admin_wallet.save()

                WalletTransaction.objects.create(
                    wallet=admin_wallet,
                    transaction_type='DEBIT',
                    amount=total_stockist_commission,
                    description=f"Commission paid to {target_user.email} for Order #{order.id}",
                    transaction_status='SUCCESS',
                    is_refund=False,
                    user_id=target_user.unique_role_id
                )

                # Credit commission to stockist
                stockist_wallet, _ = Wallet.objects.get_or_create(user=target_user)
                stockist_wallet.payout_balance += total_stockist_commission
                stockist_wallet.save()

                WalletTransaction.objects.create(
                    wallet=stockist_wallet,
                    transaction_type='CREDIT',
                    amount=total_stockist_commission,
                    description=f"Commission earned for Order #{order.id}",
                    transaction_status='SUCCESS',
                    is_refund=False,
                )

            # ✅ Step 7: Notifications
            create_notification(
                user=reseller_user,
                title="Order Placed Successfully",
                message=f"Your order #{order.id} has been approved successfully!",
                notification_type="order",
                related_url=f"/orders/{order.id}/",
            )
            create_notification(
                user=admin_user,
                title="New Order Request Placed by Reseller",
                message=f"New order #{order.id} has been placed by {reseller_user.email}",
                notification_type="order",
                related_url=f"/orders/{order.id}/",
            )

        return order


            

class ResellerOrderStatusMange(APIView):
    permission_classes = [IsAdminOrResellerRole]

    def patch(self, request, pk):
       
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"message": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        # --- Permission check ---
        if request.user != order.seller and request.user != order.buyer:
            return Response({"message": "You are not authorized to update this order."}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get("status")
        note = request.data.get("note", "")

        # --- Special case: accepted ---
        if new_status == "accepted":
            create_notification(
                user=order.buyer,
                title="Your Order is Approved by Admin",
                message=f"Order #{order.id} has been accepted. Please prepare for dispatch.",
                notification_type="order_accepted",
                related_url=f"/orders/{order.id}/"
            )
            order.payment_status = "pending_shipping"
            order.save(update_fields=["payment_status"])

        # --- Map "received" -> "delivered" ---
        if new_status == "received":
            new_status = "delivered"

        with transaction.atomic():
            previous_status = order.status
            order.status = new_status
            if new_status != "cancelled":
                order.note = note
            order.save()

            # --- Order history log ---
            OrderHistory.objects.create(
                order=order,
                actor=request.user,
                action=new_status,
                notes=order.note,
                previous_status=previous_status
            )

            # --- Handle delivered ---
            if new_status == "delivered":
                self.handle_delivered_status(order, request.user)
                # self.commission_on_delivery(order)

        # --- Send notifications ---
        self.create_notifications(order, new_status, request.user)

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def handle_delivered_status(self, order, user):
        """Handle wallet transactions + role-based product/stock setup for delivered orders"""
        try:
            with transaction.atomic():
                # --- 1️⃣ Transport charges ---
                if order.transport_charges and order.transport_charges > 0:
                    buyer_wallet, _ = Wallet.objects.get_or_create(user=order.buyer)
                    seller_wallet, _ = Wallet.objects.get_or_create(user=order.seller)
                    transport_charges = order.transport_charges

                    if buyer_wallet.current_balance >= transport_charges:
                        buyer_wallet.current_balance -= transport_charges
                        seller_wallet.current_balance += transport_charges
                        buyer_wallet.save()
                        seller_wallet.save()

                        WalletTransaction.objects.create(
                            wallet=buyer_wallet,
                            transaction_type="DEBIT",
                            amount=transport_charges,
                            description=f"Transport charges for Order #{order.id}",
                            transaction_status="SUCCESS",
                            order_id=order.id,
                            user_id=order.seller.unique_role_id
                        )
                        WalletTransaction.objects.create(
                            wallet=seller_wallet,
                            transaction_type="CREDIT",
                            amount=transport_charges,
                            description=f"Received transport charges for Order #{order.id}",
                            transaction_status="SUCCESS",
                            order_id=order.id,
                            user_id=order.buyer.unique_role_id
                        )
                        order.payment_status = "paid"
                    else:
                        WalletTransaction.objects.create(
                            wallet=buyer_wallet,
                            transaction_type="DEBIT",
                            amount=transport_charges,
                            description=f"Transport charges for Order #{order.id} (FAILED - insufficient balance)",
                            transaction_status="FAILED",
                            order_id=order.id
                        )
                        order.payment_status = "failed_shipping"

                    order.save(update_fields=["payment_status"])

                
                
                # --- 2️⃣ RoleBasedProduct / ProductVariantPrice / StockInventory ---
                for item in order.items.all():
                    product = item.product
                    variant = getattr(item, "variant", None)
                    buyer = order.buyer  

                    # Determine role
                    role = "reseller"
                
                    # RoleBasedProduct
                    rbp, _ = RoleBasedProduct.objects.get_or_create(
                        product=product,
                        user=buyer,
                        role=role,
                        defaults={"price": getattr(product, "base_price", None)}
                    )
                    if variant and variant not in rbp.variants.all():
                        rbp.variants.add(variant)
                    
               

                    # ProductVariantPrice
                    if variant:
                        pvp, created_pvp = ProductVariantPrice.objects.get_or_create(
                            product=product,
                            variant=variant,
                            user=buyer,
                            role=role,
                            actual_price=item.single_quantity_after_gst_and_discount_price,  
                            defaults={
                                "price": item.single_quantity_after_gst_and_discount_price,
                                "discount": 0,
                                "gst_percentage": 0
                            }
                        )
                        if not created_pvp and pvp.price != item.single_quantity_after_gst_and_discount_price:
                            pvp.price = item.single_quantity_after_gst_and_discount_price
                            pvp.save()
                    
         

                    # StockInventory
                    stock_inv, created_stock = StockInventory.objects.get_or_create(
                        user=buyer,
                        product=product,
                        variant=variant,
                        batch_number=item.batch_number,
                        defaults={
                            "total_quantity": item.quantity,
                            "notes": f"Initial stock from Order #{order.id}",
                            "manufacture_date": item.manufacture_date,
                            "expiry_date": item.expiry_date
                        }
                    )
                   
                    stock_inv.adjust_stock(
                        change_quantity=item.quantity,
                        action="ADD",
                        reference_id=order.id
                    )
        except Exception as e:
            print(f"Error in handle_delivered_status: {str(e)}")

    def create_notifications(self, order, new_status, current_user):
        """Create notifications for order status updates"""
        if current_user != order.buyer:
            create_notification(
                user=order.buyer,
                title="Order Status Updated",
                message=f"Your order #{order.id} status has been updated to {new_status}.",
                notification_type="order_status_update",
                related_url=f"/orders/{order.id}/"
            )

        if current_user != order.seller:
            create_notification(
                user=order.seller,
                title="Order Status Updated",
                message=f"Order #{order.id} status has been updated to {new_status}.",
                notification_type="order_status_update",
                related_url=f"/orders/{order.id}/"
            )

    def commission_on_delivery(self, order):
        """Handle commission distribution on order delivery"""
        try:
            with transaction.atomic():
                total_reseller_commission = 0
                total_stockist_commission = 0

                for item in order.items.all():
                    quantity = item.quantity

                    # Fetch commission entry
                    commission_entry = ProductCommission.objects.filter(
                        product=item.product,
                        variant=item.variant
                    ).first()

                    if not commission_entry:
                        continue

                    # Assume your ProductCommission model has fields:
                    # reseller_commission_per_qty, stockist_commission_per_qty
                    reseller_commission = quantity * getattr(commission_entry, "reseller_commission_value", 0)
                    stockist_commission = quantity * getattr(commission_entry, "stockist_commission_value", 0)

                    total_reseller_commission += reseller_commission
                    total_stockist_commission += stockist_commission

                # --- Credit reseller ---
                if total_reseller_commission > 0:
                    reseller_wallet, _ = Wallet.objects.get_or_create(user=order.buyer)
                    reseller_wallet.payout_balance += total_reseller_commission
                    reseller_wallet.save()

                    WalletTransaction.objects.create(
                        wallet=reseller_wallet,
                        transaction_type="CREDIT",
                        amount=total_reseller_commission,
                        description=f"Reseller commission from Admin for Order #{order.id}",
                        transaction_status="SUCCESS",
                        order_id=order.id
                    )

                    create_notification(
                        user=order.buyer,
                        title="Commission Earned",
                        message=f"You have earned a reseller commission of {total_reseller_commission:.2f} from Order #{order.id}.",
                        notification_type="commission",
                        related_url=f"/wallet/"
                    )

                # --- Credit stockist ---
                if total_stockist_commission > 0:
                    stockist_user = (
                        StockistAssignment.objects
                        .filter(reseller=order.buyer)
                        .select_related("stockist")
                        .last()
                    )
                    stockist_user = stockist_user.stockist if stockist_user else User.objects.filter(
                        role="stockist", is_default_user=True
                    ).last()

                    if stockist_user:
                        stockist_wallet, _ = Wallet.objects.get_or_create(user=stockist_user)
                        stockist_wallet.payout_balance += total_stockist_commission
                        stockist_wallet.save()

                        WalletTransaction.objects.create(
                            wallet=stockist_wallet,
                            transaction_type="CREDIT",
                            amount=total_stockist_commission,
                            description=f"Stockist commission from Order #{order.id}",
                            transaction_status="SUCCESS",
                            order_id=order.id
                        )

                        create_notification(
                            user=stockist_user,
                            title="Commission Earned",
                            message=f"You have earned a stockist commission of {total_stockist_commission:.2f} from Order #{order.id}.",
                            notification_type="commission",
                            related_url=f"/wallet/"
                        )
        except Exception as e:
            print(f"Error in commission_on_delivery: {str(e)}")


class ResellerProductsList(generics.ListAPIView):
    queryset = RoleBasedProduct.objects.all()
    serializer_class = CustomerPurchaseRoleBasedProductSerializer
    permission_classes = [IsResellerRole]

    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter(user=user, role='reseller').prefetch_related('variants')
    
class ResellerVaraintsList(generics.ListAPIView):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    permission_classes = [IsResellerRole]

    def get_queryset(self,product_id=None):
        product_id = self.request.query_params.get('product_id')

        if product_id:
            role_prod=RoleBasedProduct.objects.get(id=int(product_id))
            return self.queryset.filter(product_id=role_prod.product.id)
        return self.queryset.filter(name="testting")  # return empty queryset


class CustomerPurchaseCreateView(generics.CreateAPIView):
    queryset = CustomerPurchase.objects.all()
    serializer_class = CustomerPurchaseSerializer
    permission_classes = [IsResellerRole]  # You can also chain with IsAuthenticated

    def perform_create(self, serializer):
        purchase = serializer.save(vendor=self.request.user)
        self.process_customer_purchase(purchase)

    def process_customer_purchase(self, purchase: CustomerPurchase):
        with transaction.atomic():
            # 1️⃣ Deduct stock
            try:
                inventory = StockInventory.objects.select_for_update().get(
                    product=purchase.product.product,
                    variant=purchase.variant,
                    user=purchase.vendor
                )
            except StockInventory.DoesNotExist:
                raise ValueError("No stock found for this product and variant.")

            inventory.adjust_stock(
                -purchase.quantity,
                action="CUSTOMER_PURCHASE",
                reference_id=purchase.id
            )

            # 2️⃣ Get admin user and admin product
            admin_user = User.objects.filter(role="admin").first()
            if not admin_user:
                raise ValueError("Admin user not found.")

            try:
                role_product = RoleBasedProduct.objects.get(
                    product=purchase.product.product,
                    user=admin_user,
                    role="admin"
                )
            except RoleBasedProduct.DoesNotExist:
                raise ValueError("Admin role-based product not found for commission calculation.")

            # 3️⃣ Get commission record
            commission = ProductCommission.objects.filter(
                role_product=role_product,
                variant=purchase.variant
            ).first()

            if not commission:
                return  # No commission defined — skip wallet ops

            # 4️⃣ Compute commission
            if commission.commission_type == "percent":
                reseller_comm_value = (purchase.total_price * commission.reseller_commission_value) / Decimal(100)
            else:
                reseller_comm_value = commission.reseller_commission_value * purchase.quantity

            total_to_deduct = reseller_comm_value

            # 5️⃣ Admin wallet adjustment
            admin_wallet, _ = Wallet.objects.get_or_create(user=admin_user)

            if admin_wallet.current_balance < total_to_deduct:
                raise ValueError("Admin wallet does not have enough balance to pay commission.")

            admin_wallet.current_balance -= total_to_deduct
            admin_wallet.save(update_fields=["current_balance"])

            # 6️⃣ Reseller wallet adjustment
            reseller_wallet, _ = Wallet.objects.get_or_create(user=purchase.vendor)
            reseller_wallet.payout_balance += total_to_deduct
            reseller_wallet.save(update_fields=["payout_balance"])

            # 7️⃣ Wallet transaction history
            WalletTransaction.objects.create(
                wallet=reseller_wallet,
                transaction_type="CREDIT",
                amount=total_to_deduct,
                description=f"Reseller commission For Selling Products to Customer,Customer Puchase ID:{purchase.id}",
                transaction_status="SUCCESS",
                order_id=purchase.email
            )

            WalletTransaction.objects.create(
                wallet=admin_wallet,
                transaction_type="DEBIT",
                amount=total_to_deduct,
                description=f"Commission payout to reseller for Selling Products To Customer ",
                transaction_status="SUCCESS",
                order_id="",
                user_id=purchase.vendor.unique_role_id
            )

            # 8️⃣ Notifications
            create_notification(
                user=purchase.vendor,
                title="Commission Earned",
                message=f"You earned a commission of ₹{total_to_deduct:.2f} from Selling Products To Customer #{purchase.email}.",
                notification_type="commission",
                related_url="/wallet/"
            )

            create_notification(
                user=admin_user,
                title="Commission Paid",
                message=f"You paid ₹{total_to_deduct:.2f} as commission for Selling Products to Customer",
                notification_type="commission",
                related_url="/wallet/"
            )




class CustomerPurchaseListView(generics.ListAPIView):
    serializer_class = CustomerPurchaseSerializer
    permission_classes = [IsResellerRole]
    
    def get_queryset(self):
        # Only show purchases created by the current vendor
        return CustomerPurchase.objects.filter(vendor=self.request.user).order_by('-purchase_date')

class CustomerPurchaseDetailView(generics.RetrieveAPIView):
    serializer_class = CustomerPurchaseSerializer
    permission_classes = [IsResellerRole]
    lookup_field = 'id'
    
    def get_queryset(self):
        # Only allow access to purchases created by the current vendor
        return CustomerPurchase.objects.filter(vendor=self.request.user)

class CustomerPurchaseListPaginatedView(generics.ListAPIView):
    serializer_class = CustomerPurchaseListSerializer
    permission_classes = [IsResellerRole]
    
    def get_queryset(self):
        return CustomerPurchase.objects.filter(vendor=self.request.user).order_by('-purchase_date')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Pagination
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 10)
        
        paginator = Paginator(queryset, page_size)
        try:
            purchases = paginator.page(page)
        except:
            purchases = paginator.page(1)
        
        serializer = self.get_serializer(purchases, many=True)
        
        return Response({
            'count': paginator.count,
            'total_pages': paginator.num_pages,
            'current_page': purchases.number,
            'next': purchases.next_page_number() if purchases.has_next() else None,
            'previous': purchases.previous_page_number() if purchases.has_previous() else None,
            'results': serializer.data
        })
    
class UpdateOrderItemsView(APIView):
    permission_classes = [IsAdminOrVendorRole] 
    def patch(self, request, order_id):
        user = request.user 

        if not user.is_authenticated:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        items_data = request.data.get("items", [])
        if not items_data:
            return Response({"detail": "No items provided"}, status=status.HTTP_400_BAD_REQUEST)

        updated_items = []
        for item_data in items_data:
            try:
                order_item = OrderItem.objects.get(id=item_data["item_id"], order=order)
            except OrderItem.DoesNotExist:
                continue

            order_item.batch_number = item_data.get("batch_number", order_item.batch_number)
            order_item.manufacture_date = item_data.get("manufacture_date", order_item.manufacture_date)
            order_item.expiry_date = item_data.get("expiry_date", order_item.expiry_date)
            order_item.save()

            

        return Response({"message": "Batch Details Updated Successfully"}, status=status.HTTP_200_OK)
    

class CustomerSearchView(generics.ListAPIView):
    permission_classes = [IsResellerRole]
    
    def get_queryset(self):
        # Get customers from previous purchases made by this vendor
        return CustomerPurchase.objects.filter(
            vendor=self.request.user
        ).values(
            'full_name', 'phone', 'email', 'address', 'city', 'state', 'district', 'postal_code'
        ).distinct()
    
    def list(self, request, *args, **kwargs):
        search_query = request.query_params.get('search', '')
        
        
        # Get unique customers from vendor's purchase history
        purchases = CustomerPurchase.objects.filter(vendor=request.user)
        
        if search_query:
            purchases = purchases.filter(
                Q(full_name__icontains=search_query) |
                Q(phone__icontains=search_query) |
                Q(email__icontains=search_query)
            )
        
        # Get unique customer data
        customer_data = purchases.values(
            'full_name', 'phone', 'email', 'address', 'city', 
            'state_id', 'district_id', 'postal_code'
        ).distinct()
        
        # Convert to list and include state/district names
        customers = []
        for customer in customer_data:
            customer_dict = {
                'full_name': customer['full_name'],
                'phone': customer['phone'],
                'email': customer['email'],
                'address': customer['address'],
                'city': customer['city'],
                'postal_code': customer['postal_code'],
                'state': customer['state_id'],
                'district': customer['district_id'],
            }
            customers.append(customer_dict)
        
        return Response(customers)
    
@api_view(['GET'])
@permission_classes([IsResellerRole])  
def get_variant_buying_price(request):
    """
    Get actual buying price for a product variant based on user's role
    """
    variant_id = request.GET.get('variant_id')
    user_id = request.GET.get('user_id')
    

    
    if not variant_id or not user_id:
        return Response({
            'success': False,
            'error': 'Variant ID and User ID are required'
        }, status=400)
    
    try:
        # Get the price for the specific variant, user, and role
        variant_price = ProductVariantPrice.objects.filter(
            variant_id=variant_id,
            role="admin" 
        ).first()
        
        if variant_price:
            return Response({
                'success': True,
                'actual_price': str(variant_price.reseller_price),
                'price': str(variant_price.price),
                'discount': variant_price.discount,
                'gst_percentage': variant_price.gst_percentage,
                'gst_tax': str(variant_price.gst_tax),
                'stockist_price': str(variant_price.stockist_price),
                'reseller_price': str(variant_price.reseller_price)
            })
        else:
            return Response({
                'success': False,
                'error': 'Price not found for this variant and role'
            }, status=404)
            
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)