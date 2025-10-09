from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import *
from .serializers import *
from django.utils.timezone import now
from accounts.permissions import IsAdminRole, IsStockistRole, IsVendorRole, IsAdminOrVendorRole, IsAdminStockistResellerRole,IsAdminOrStockistRole,IsStockistOrResellerRole,IsAdminOrResellerRole
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

            total_price = 0
            created_orders = []

            for item in items_data:
                product_id = item.get("product_id")
                variant_id = item.get("variant_id")
                quantity = item.get("quantity", 0)

                # Basic validation
                if not product_id or quantity <= 0:
                    return Response({"message": f"Invalid product or quantity in item: {item}"}, status=400)

                # 🔹 Get product and its owner (seller)
                try:
                    product = Product.objects.get(id=product_id)
                    seller = product.owner  # assuming Product model has a ForeignKey 'owner'
                except Product.DoesNotExist:
                    return Response({
                        "message": f"Product with ID {product_id} not found."
                    }, status=400)

                # 🔹 Check stock using seller
                try:
                    stock_inv = StockInventory.objects.get(
                        user=seller,
                        product_id=product_id,
                        variant_id=variant_id
                    )
                except StockInventory.DoesNotExist:
                    return Response({
                        "message": f"No stock found for product {product_id} (variant: {variant_id}) "
                                f"under seller {seller.username if hasattr(seller, 'username') else seller.id}. "
                                f"Contact vendor to add stock in their inventory."
                    }, status=400)

                # 🔹 Validate stock quantity
                if stock_inv.total_quantity < quantity:
                    # Create low stock notification for seller
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

                    return Response({
                        "message": f"Insufficient stock for product {product_id}. "
                                f"Available: {stock_inv.total_quantity}, Requested: {quantity}. "
                                f"Contact vendor to add stock."
                    }, status=400)

                # 🔹 Create order (deduction handled inside create_bulk_order)
                order, order_total = OrderService.create_bulk_order(request.user, [item])
                total_price += order_total
                created_orders.append(order.id)

            return Response({
                "message": "Order(s) created successfully.",
                "order_ids": created_orders,
                "total_deducted": total_price
            }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({"message": str(e)}, status=400)
        except Exception as e:
            return Response({"message": str(e)}, status=400)



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
                    order_id=order.id
                )
                WalletTransaction.objects.create(
                    wallet=seller_wallet,
                    transaction_type='CREDIT',
                    amount=transport_charges,
                    description=f"Received transport charges for Order #{order.id}",
                    transaction_status='SUCCESS',
                    order_id=order.id
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
                    self._setup_product_variant_price(product, variant, buyer, role, item.unit_price)

                # Setup stock inventory
                self._setup_stock_inventory(product, variant, buyer, item.quantity, order.id)
                
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
                order_id=order.id
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

    def _setup_product_variant_price(self, product, variant, user, role, unit_price):
        """Setup ProductVariantPrice"""
        pvp, created = ProductVariantPrice.objects.get_or_create(
            product=product,
            variant=variant,
            user=user,
            role=role,
            defaults={
                "price": unit_price, 
                "discount": 0, 
                "gst_percentage": 0
            }
        )
        
        if not created:
            # Update price if changed
            pvp.price = unit_price
            pvp.save()

    def _setup_stock_inventory(self, product, variant, user, quantity, order_id):
        """Setup or update stock inventory"""
        stock_inv, created = StockInventory.objects.get_or_create(
            user=user,
            product=product,
            variant=variant,
            defaults={
                "total_quantity": quantity,
                "notes": f"Initial stock from Order #{order_id}"
            }
        )
        
        if not created:
            stock_inv.adjust_stock(
                change_quantity=quantity,
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
                    'unit_price': item.unit_price,
                    'total_price': item.total,
                    'order_id': order.id
                })
                total_sales += item.total
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
                        'unit_price': str(item.unit_price),
                        'total_price': str(item.total),
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
    target_user → The admin whose stock will be reduced.
    We also credit the stockist's inventory at the same time.
    """

    stockist_user = order_request.requested_by  # the buyer
    target_user=order_request.target_user  # the admin whose stock will be reduced

    for item in order_request.items.all():
        # ---------------------------------------
        # 1️⃣ Deduct from Admin Inventory
        # ---------------------------------------
        admin_stock= StockInventory.objects.get(
            product=item.product.product,
            variant=item.variant,
            user=target_user
            
        )

        admin_stock.adjust_stock(
            change_quantity=-item.quantity,           # deduct
            action="ORDER",
            reference_id=f"OrderReq-{order_request.id}",
        )

        # ---------------------------------------
        # 2️⃣ Add to Stockist Inventory
        # ---------------------------------------
        stockist_stock, _ = StockInventory.objects.get_or_create(
            product=item.product.product,
            variant=item.variant,
            user=stockist_user,
            defaults={"total_quantity": 0},
        )

        stockist_stock.adjust_stock(
            change_quantity=item.quantity,           
            action="ADD",
            reference_id=f"OrderReq-{order_request.id}",
        )

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

@api_view(['GET'])
@permission_classes([IsStockistOrResellerRole])
def get_reseller_order_requests_by_status(request, status):
    user = request.user
    queryset = OrderRequest.objects.select_related('requested_by', 'target_user').prefetch_related('items')
    if not user.role=="stockist":
        queryset = queryset.filter(requested_by=user)
    
    if user.role=="stockist":
        queryset = queryset.filter(target_user=user).exclude(status='cancelled')
    
    if status=="rejected" and not user.role=="stockist":
        queryset = queryset.filter(Q(status='rejected') | Q(status='cancelled'))
    else:
        queryset = queryset.filter(status=status)
    
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
            admin_wallet.payout_balance += total_amount
            admin_wallet.save()

            WalletTransaction.objects.create(
                wallet=admin_wallet,
                transaction_type='CREDIT',
                amount=total_amount,
                description=f"Order Request {order_request.request_id} By Reseller",
                transaction_status='SUCCESS',
                is_refund=False
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

        with transaction.atomic():
            # ✅ Step 1: Preload all stock records in one query
            stock_map = {
                (s.product_id, s.variant_id): s
                for s in StockInventory.objects.select_for_update().filter(
                    user=target_user,
                    product__in=[i.product.product for i in order_request.items.all()],
                    variant__in=[i.variant for i in order_request.items.all()],
                )
            }

            # ✅ Step 2: Validate and deduct in one pass
            for item in order_request.items.all():
                key = (item.product.product.id, item.variant.id)
                admin_stock = stock_map.get(key)

                if not admin_stock:
                    raise ValueError(f"No stock found for {item.product.product} - {item.variant}")

                if admin_stock.total_quantity < item.quantity:
                    raise ValueError(
                        f"Not enough stock for {item.product.product} - {item.variant}. "
                        f"Available: {admin_stock.total_quantity}, Requested: {item.quantity}"
                    )

                # Deduct immediately
                admin_stock.adjust_stock(
                    change_quantity=-item.quantity,
                    action="ORDER",
                    reference_id=f"OrderReq-{order_request.id}",
                )

                validated_items.append({
                    "product": item.product.product,
                    "variant": item.variant,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "discount_percentage": item.discount_percentage,
                    "gst_percentage": item.gst_percentage,
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

            # ✅ Step 5: Bulk create Order Items
            order_items = [
                OrderItem(
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
                for item in validated_items
            ]
            OrderItem.objects.bulk_create(order_items)

            # ✅ Step 6: Send Notification
            create_notification(
                user=reseller_user,
                title="Order Placed Successfully",
                message=f"Your order #{order.id} has been Approved successfully!",
                notification_type="order",
                related_url=f"/orders/{order.id}/",
            )
            create_notification(
                user=admin_user,
                title="New Order Placed by Reseller",
                message=f"New order #{order.id} has been placed by {reseller_user.email}",
                notification_type="order",
                related_url=f"/orders/{order.id}/",
            )

        return order
        

            






# 2️⃣ Add to reseller Inventory
            # stockist_stock, _ = StockInventory.objects.get_or_create(
            #     product=item.product.product,
            #     variant=item.variant,
            #     user=stockist_user,
            #     defaults={"total_quantity": 0},
            # )

            # stockist_stock.adjust_stock(
            #     change_quantity=item.quantity,
            #     action="ADD",
            #     reference_id=f"OrderReq-{order_request.id}",
            # )


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
                self.commission_on_delivery(order)

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
                            order_id=order.id
                        )
                        WalletTransaction.objects.create(
                            wallet=seller_wallet,
                            transaction_type="CREDIT",
                            amount=transport_charges,
                            description=f"Received transport charges for Order #{order.id}",
                            transaction_status="SUCCESS",
                            order_id=order.id
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
                            defaults={"price": item.unit_price, "discount": 0, "gst_percentage": 0}
                        )
                        if not created_pvp and pvp.price != item.unit_price:
                            pvp.price = item.unit_price
                            pvp.save()

                    # StockInventory
                    stock_inv, created_stock = StockInventory.objects.get_or_create(
                        user=buyer,
                        product=product,
                        variant=variant,
                        defaults={
                            "total_quantity": item.quantity,
                            "notes": f"Initial stock from Order #{order.id}"
                        }
                    )
                    if not created_stock:
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