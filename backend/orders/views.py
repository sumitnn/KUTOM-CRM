from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import *
from .serializers import *
from django.utils.timezone import now
from accounts.permissions import IsAdminRole, IsStockistRole, IsVendorRole, IsAdminOrVendorRole, IsAdminStockistResellerRole
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
from accounts.models import User, Wallet, WalletTransaction
from products.models import StockInventory

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
    permission_classes = [IsVendorRole]
    pagination_class = MyOrdersPagination

    def get_queryset(self):
        user = self.request.user
        
       
        queryset = Order.objects.filter(seller=user)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            if status_filter == "new":
                queryset = queryset.filter(status="pending")
            elif status_filter == "delivered":
                queryset = queryset.filter(status='received')
            else:
                queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-created_at')


class BulkOrderCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        items_data = data.get("items", [])

        if not isinstance(items_data, list) or not items_data:
            return Response({"message": "Invalid or empty 'items' list."}, status=400)

        try:
            if request.user.role in ["stockist", "reseller"]:
                order, total_price = OrderService.create_bulk_order_from_admin(request.user, items_data)
            elif request.user.role == "admin":
                order, total_price = OrderService.create_bulk_order(request.user, items_data)
            else:
                return Response({"message": "You don't have access to order items."}, status=400)

            return Response({
                "message": "Order created successfully.",
                "order_id": order.id,
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
            if not (request.user == order.buyer or request.user == order.seller or request.user.is_staff):
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
        import pdb; pdb.set_trace()

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
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"message": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check permissions
        if request.user != order.seller and request.user != order.buyer:
            return Response({"message": "You are not authorized to update this order."}, status=status.HTTP_403_FORBIDDEN)



        new_status = request.data.get('status')

        if new_status == "accepted":
            self.handle_accepted_status(order, request.user)


        if new_status == "received":
            new_status = "delivered"
        note = request.data.get('note', '')
      

        with transaction.atomic():
            previous_status = order.status

            if new_status == 'cancelled':
                # 1️⃣ Revert stock to seller
                for item in order.items.all():  # assuming related_name='items'
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
                        # create stock if missing
                        StockInventory.objects.create(
                            user=order.seller,
                            product=item.product,
                            variant=getattr(item, 'variant', None),
                            total_quantity=item.quantity,
                            notes=f"Restocked due to order cancellation #{order.id}"
                        )

                # 2️⃣ Refund buyer wallet
                try:
                    buyer_wallet, _ = Wallet.objects.get_or_create(user=order.buyer)
                    buyer_wallet.current_balance += order.total_price  # refund full order
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
                    print(f"Error refunding buyer: {str(e)}")

                # Update order payment status
                order.payment_status = "refunded"
                order.note = "Order cancelled by customer"

                # 3️⃣ Notifications
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

            # Update order status
            order.status = new_status
            if new_status != 'cancelled':
                order.note = note
            order.save()

            # Create history record
            OrderHistory.objects.create(
                order=order,
                actor=request.user,
                action=new_status,
                notes=order.note,
                previous_status=previous_status
            )

            # Handle delivered status
            if new_status == 'delivered':
                self.handle_delivered_status(order, request.user)

            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def handle_delivered_status(self, order, user):
        """Handle wallet transactions + role-based product/stock setup for delivered orders"""
        # --- 1️⃣ Transport charges (already implemented) ---
        if order.transport_charges and order.transport_charges > 0:
            try:
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
                    order.payment_status = "paid"
                else:
                    WalletTransaction.objects.create(
                        wallet=buyer_wallet,
                        transaction_type='DEBIT',
                        amount=transport_charges,
                        description=f"Transport charges for Order #{order.id} (FAILED - insufficient balance)",
                        transaction_status='FAILED',
                        order_id=order.id
                    )
                    order.payment_status = "failed_shipping"
                order.save(update_fields=["payment_status"])
            except Exception as e:
                print(f"Error processing transport charges: {str(e)}")
                order.payment_status = "failed_shipping"
                order.save(update_fields=["payment_status"])

        # --- 2️⃣ Setup RoleBasedProduct, VariantPrice, StockInventory ---
        for item in order.items.all():
            product = item.product
            variant = getattr(item, "variant", None)

            # 🔹 Determine role from seller
            buyerr = order.buyer  # buyer is the reseller/stockist
            role = "admin"
            if hasattr(buyerr, "profile"):
                if buyerr.stockist_id:
                    role = "stockist"
                elif buyerr.reseller_id:
                    role = "reseller"
           

            # --- RoleBasedProduct ---
            rbp, created_rbp = RoleBasedProduct.objects.get_or_create(
                product=product,
                user=buyerr,
                role=role,
                defaults={"price": product.base_price if hasattr(product, "base_price") else None}
            )
            # attach variant if missing
            if variant and variant not in rbp.variants.all():
                rbp.variants.add(variant)

            # --- ProductVariantPrice ---
            if variant:
                pvp, created_pvp = ProductVariantPrice.objects.get_or_create(
                    product=product,
                    variant=variant,
                    user=buyerr,
                    role=role,
                    defaults={"price": item.unit_price, "discount": 0, "gst_percentage": 0}
                )
                if not created_pvp:
                    # update latest price if changed
                    pvp.price = item.unit_price
                    pvp.save()

            # --- StockInventory ---
            stock_inv, created_stock = StockInventory.objects.get_or_create(
                user=buyerr,
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

    def handle_accepted_status(self, order, user):
        """Handle wallet transactions when order is accepted"""
        try:
            seller_wallet, _ = Wallet.objects.get_or_create(user=order.seller)

            order_amount = order.total_price

            if seller_wallet:
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

                # Mark as paid
                order.payment_status = "pending_shipping"
                order.save(update_fields=["payment_status"])

                # 🔔 Notifications
                create_notification(
                    user=order.seller,
                    title="Payment Received",
                    message=f"You have received {order_amount} for Order #{order.id}.",
                    notification_type="order_payment_received",
                    related_url=f"/orders/{order.id}/",
                )
                create_notification(
                    user=order.buyer,
                    title="Payment Successful",
                    message=f"Your payment of {order_amount} for Order #{order.id} has been received by the seller.",
                    notification_type="order_payment_success",
                    related_url=f"/orders/{order.id}/",
                )

            else:
                raise Exception("Seller wallet not found.")

        except Exception as e:
            print(f"Error processing order payment: {str(e)}")
            order.payment_status = "failed"
            order.save(update_fields=["payment_status"])



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
    permission_classes = [IsAdminOrVendorRole]

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

        print(Order.objects.filter(
            seller=user, 
            status='delivered').count())
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