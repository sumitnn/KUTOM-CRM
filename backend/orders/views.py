from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import *
from .serializers import *
from django.utils.timezone import now
from accounts.permissions import IsAdminRole, IsStockistRole, IsVendorRole,IsAdminOrVendorRole,IsAdminStockistResellerRole
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
from products.models import AdminProduct, AdminProductSize, AdminProductImage
from django.shortcuts import get_object_or_404

# Reseller can create
class CreateOrderAPIView(generics.CreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role != 'reseller':
            raise permissions.PermissionDenied("Only resellers can create orders.")
        serializer.save(reseller=self.request.user)





# Stockist can view and forward
class StockistOrderListAPIView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(stockist=self.request.user, status='pending')

class ForwardOrderAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        order = Order.objects.get(id=pk, stockist=request.user)
        order.status = 'forwarded'
        order.save()
        return Response({"message": "Order forwarded to admin."})


class MyOrdersPagination(PageNumberPagination):
    page_size = 10  # or any number you prefer

class MyOrdersView(ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MyOrdersPagination

    def get_queryset(self):
        user = self.request.user
 
        queryset = Order.objects.filter(created_by=user)

        # Optional: Filter by status from query params
        status = self.request.query_params.get('status')
        if status:
            if status =="received":
                queryset = queryset.filter(status__in=['delivered', 'received'])
            elif status == "all":
                queryset = queryset.all()
            else:
                queryset = queryset.filter(status=status)

        return queryset

class VendorOrdersView(ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsVendorRole]
    pagination_class = MyOrdersPagination

    def get_queryset(self):
        user = self.request.user
 
        queryset = Order.objects.filter(created_for=user)

        # Optional: Filter by status from query params
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        return queryset


class BulkOrderCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        items_data = data.get("items")

        if not isinstance(items_data, list) or not items_data:
            return Response({"message": "Invalid or empty 'items' list."}, status=400)

        try:
            if request.user.role in ["stockist", "reseller"]:
                order, total_price = OrderService.create_bulk_order_from_admin(request.user, items_data)
            elif request.user.role == "admin":
                order, total_price = OrderService.create_bulk_order(request.user, items_data)
            else:
                return Response({"message": "You don’t have access to order items."}, status=400)

            return Response({
                "message": "Order created successfully.",
                "order_id": order.id,
                "total_deducted": total_price
            }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({"message": str(e)}, status=400)
        except Exception as e:
            return Response({"message": str(e)}, status=400)


class StockistAcceptOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, status='pending')

            stockist = request.user
            order.status = 'accepted'
            order.stockist = stockist
            order.save()

            # Add funds to stockist's wallet
            stockist.wallet_balance += order.total_price
            stockist.save()

            return Response({"message": "Order accepted and balance credited."})

        except Order.DoesNotExist:
            return Response({"error": "Order not found or not in pending state."}, status=404)


class StockistCancelOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, stockist=request.user, status='accepted')

            # Refund to reseller
            reseller = order.reseller
            reseller.wallet_balance += order.total_price
            reseller.save()

            order.status = 'cancelled'
            order.save()

            return Response({"message": "Order cancelled, amount refunded to reseller."})

        except Order.DoesNotExist:
            return Response({"error": "Order not found or not accepted by this stockist."}, status=404)


# Admin-specific filters
class AdminOrderListView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        filter_type = request.query_params.get('filter', 'today')
        search_term = request.query_params.get('search', '')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        today = timezone.now().date()

        # Base queryset: orders belonging to the logged-in admin
        base_qs = Order.objects.filter(created_for=request.user)

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
                Q(created_by__username__icontains=search_term) |
                Q(created_by__email__icontains=search_term) |
                Q(created_for__username__icontains=search_term) |
                Q(created_for__email__icontains=search_term)
            )
            orders = orders.filter(search_q)

        # Date range filter
        if start_date and end_date:
            orders = orders.filter(
                created_at__date__gte=start_date,
                created_at__date__lte=end_date
            )

        # Aggregate counts in a single DB hit
        status_counts = (
            base_qs
            .values('status')
            .annotate(count=Count('id'))
        )
        counts_dict = {status: 0 for status in [
            'new', 'accepted', 'ready_for_dispatch', 'dispatched',
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



class AdminApproveRejectOrderAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        order = Order.objects.get(pk=pk)
        action = request.data.get('action')  # 'approve' or 'reject'
        if action == 'approve':
            order.status = 'approved'
        elif action == 'reject':
            order.status = 'rejected'
        else:
            return Response({"error": "Invalid action"}, status=400)
        order.save()
        return Response({"message": f"Order {order.status}."})
    

class OrderSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        orders = Order.objects.filter(created_by=user)

        status_counts = orders.values('status').annotate(count=Count('id'))
        status_dict = {'All': orders.count(), 'Pending': 0, 'Approved': 0, 'Rejected': 0}
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
    

class OrderDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = Order.objects.prefetch_related('items__product').get(id=order_id)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderDetailSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class AdminProductOrderDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id):
        
        order = get_object_or_404(
            Order.objects.prefetch_related(
                'items__product',
                'items__product_size',
                'items__admin_product',
                'items__admin_product_size'
            ),
            id=order_id
        )
        
        # Check if user has permission to view this order
        if not (request.user == order.created_by or request.user == order.created_for or request.user.is_staff):
            return Response(
                {"detail": "You do not have permission to view this order."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = OrderDetailSerializer(order, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)   

class CancelOrderAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)
        
        if order.status != 'new':
            return Response(
                {"detail": "Only new orders can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if request.user != order.created_by and not request.user.is_staff:
            return Response(
                {"detail": "You don't have permission to cancel this order."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Create history record
        OrderHistory.objects.create(
            order=order,
            actor=request.user,
            action='cancelled',
            notes=request.data.get('note', 'Order cancelled by customer'),
            previous_status=order.status
        )

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

        if request.user != order.created_by and request.user != order.created_for:
            return Response({"message": "You are not authorized to update this order."}, status=status.HTTP_403_FORBIDDEN)

        is_received = request.data.get('status') == 'received'
        is_delivered = request.data.get('status') == 'delivered'

        if request.data.get('status') == 'received' and request.user.role == 'admin':
            request.data['status'] = 'delivered'

        serializer = OrderStatusUpdateSerializer(order, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            admin_user = User.objects.filter(role='admin').first()

            # Notifications
            if admin_user:
                create_notification(
                    user=admin_user,
                    title="Order Status Updated",
                    message=f"Order #{order.id} status updated to {serializer.validated_data.get('status', order.status)}.",
                    notification_type="order status update",
                    related_url=f"/orders/{order.id}/"
                )
            if is_received or is_delivered:
                create_notification(
                    user=order.created_for,
                    title="Order Delivered Successfully",
                    message=f"Your order #{order.id} has been delivered successfully.",
                    notification_type="order status update",
                    related_url=f"/orders/{order.id}/"
                )

                # ✅ Create Admin Product from Vendor's Product
                self.create_admin_product(order, admin_user)

            # Wallet handling if delivered
            if serializer.validated_data.get('status') == 'delivered':
                self.handle_wallet_transactions(order, admin_user)

            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def handle_wallet_transactions(self, order, admin_user):
        transport_charges = order.transport_charges or 0
        if transport_charges > 0:
            try:
                admin_wallet = Wallet.objects.get(user=admin_user)
                user_wallet = Wallet.objects.get(user=order.created_for)

                if admin_wallet.balance < transport_charges:
                    raise ValidationError({"message": "Insufficient admin wallet balance."})

                admin_wallet.balance -= transport_charges
                user_wallet.balance += transport_charges
                admin_wallet.save()
                user_wallet.save()

                WalletTransaction.objects.create(
                    wallet=admin_wallet,
                    transaction_type='DEBIT',
                    amount=transport_charges,
                    description=f"Transport charges for Order #{order.id}",
                    transaction_status='SUCCESS'
                )
                WalletTransaction.objects.create(
                    wallet=user_wallet,
                    transaction_type='CREDIT',
                    amount=transport_charges,
                    description=f"Received transport charges for Order #{order.id}",
                    transaction_status='RECEIVED'
                )
            except Wallet.DoesNotExist:
                raise ValidationError({"message": "Admin or user wallet not found."})

    @transaction.atomic
    def create_admin_product(self, order, admin_user):
        # Assuming order has order_items with product
        
        for item in order.items.all():
            vendor_product = item.product

            # Prevent duplicates if already copied
            if AdminProduct.objects.filter(
                source_product_id=vendor_product.id,
                admin=admin_user
            ).exists():
                continue

            admin_product = AdminProduct.objects.create(
                name=vendor_product.name,
                description=vendor_product.description,
                short_description=vendor_product.short_description,
                price=item.price,
                weight=vendor_product.weight,
                weight_unit=vendor_product.weight_unit,
                dimensions=vendor_product.dimensions,
                product_type=vendor_product.product_type,
                currency=vendor_product.currency,
                admin=admin_user,
                original_vendor=vendor_product.owner,
                source_product_id=vendor_product.id,
                resale_price=item.price,  
                quantity_available=item.quantity,
                video_url=vendor_product.video_url,
                is_active=True
            )

            # Copy product sizes
            for size in vendor_product.sizes.all():
                AdminProductSize.objects.create(
                    admin_product=admin_product,
                    size=size.size,
                    unit=size.unit,
                    price=size.price,
                    is_default=size.is_default,
                    is_active=size.is_active
                )

            # Copy product images
            for img in vendor_product.images.all():
                AdminProductImage.objects.create(
                    admin_product=admin_product,
                    image=img.image,
                    alt_text=img.alt_text,
                    is_featured=img.is_featured,
                    is_default=img.is_default
                )





class UpdateStockistResellerOrderStatusView(APIView):
    permission_classes = [IsAdminStockistResellerRole]

    def patch(self, request, pk):
        
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"message": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user != order.created_by and request.user != order.created_for:
            return Response({"message": "You are not authorized to update this order."}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        note = request.data.get('note', '')

        with transaction.atomic():
            # Update order status
            serializer = OrderStatusUpdateSerializer(order, data={'status': new_status, 'note': note}, partial=True)
            if serializer.is_valid():
                serializer.save()

                # Handle different status updates
                if new_status == 'received' or new_status == 'delivered':
                    self.handle_received_status(order, request.user)
                    self.handle_delivered_status(order,request.user)

                # Create notifications
                self.create_notifications(order, new_status, request.user)

                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def handle_received_status(self, order, user):
        if user.role == 'stockist':
            for item in order.items.all():
                if not item.admin_product:
                    continue  # skip if no admin product

                stock_item, created = Inventory.objects.get_or_create(
                    product=item.admin_product,
                    product_size=item.admin_product_size,
                    movement_type="IN",
                    user=user,
                    defaults={'quantity': item.quantity}
                )
                if not created:
                    stock_item.quantity += item.quantity
                    stock_item.save()

    def handle_delivered_status(self, order,user):

        if user and order.transport_charges and order.transport_charges > 0:
            self.handle_wallet_transactions(order, user)

    def handle_wallet_transactions(self, order, user):
        transport_charges = order.transport_charges or 0
        try:
            user_wallet = Wallet.objects.get(user=user)
            admin_wallet = Wallet.objects.get(user=order.created_for)

            if user_wallet.balance < transport_charges:
                raise ValidationError({"message": "Insufficient admin wallet balance."})

            user_wallet.balance -= transport_charges
            admin_wallet.balance += transport_charges
            admin_wallet.save()
            user_wallet.save()

            WalletTransaction.objects.create(
                wallet=user_wallet,
                transaction_type='DEBIT',
                amount=transport_charges,
                description=f"Transport charges for Order #{order.id}",
                transaction_status='SUCCESS'
            )
            WalletTransaction.objects.create(
                wallet=admin_wallet,
                transaction_type='CREDIT',
                amount=transport_charges,
                description=f"Received transport charges for Order #{order.id}",
                transaction_status='RECEIVED'
            )
        except Wallet.DoesNotExist:
            raise ValidationError({"message": "Admin or user wallet not found."})

    def create_notifications(self, order, new_status, current_user):
       
        create_notification(
            user=current_user,
            title="Order Status Updated",
            message=f"Order #{order.id} status updated to {new_status}.",
            notification_type="order status update",
            related_url=f"/orders/{order.id}/"
        )

        if new_status in ['received', 'delivered']:
            create_notification(
                user=order.created_for,
                title=f"Order {new_status.capitalize()} Successfully",
                message=f"Your order #{order.id} has been {new_status} successfully.",
                notification_type="order status update",
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

        # ✅ Role check for admin users
        if getattr(request.user, "role", None) == "admin":
            if order.created_for != request.user:
                return Response(
                    {"message": "You are not allowed to update this order."},
                    status=status.HTTP_403_FORBIDDEN
                )

        tracking_number = request.data.get('tracking_id')

        # 🔍 Check if tracking number already exists (excluding this order)
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
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    


class OrderHistoryListAPIView(generics.ListAPIView):
    queryset = OrderHistory.objects.select_related(
        'order', 'actor'
    )
    serializer_class = OrderHistorySerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = {
        'action': ['exact'],
        'timestamp': ['gte', 'lte'],
        'actor__id': ['exact'],
    }
    ordering_fields = ['timestamp', 'action']
    ordering = ['-timestamp']


class ExportOrderHistoryExcelAPIView(generics.ListAPIView):
    queryset = OrderHistory.objects.select_related('order', 'actor', 'order__product__brand', 'order__product__category', 'order__product__subcategory')
    serializer_class = OrderHistorySerializer

    def get(self, request, *args, **kwargs):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="order_history.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Sr No', 'Date', 'Name', 'Brand', 'Category', 'Subcategory',
            'Qty', 'Actual Rate', 'Accepted Price', 'Status Received', 'Amount'
        ])

        for idx, history in enumerate(self.get_queryset(), start=1):
            writer.writerow([
                idx,
                history.timestamp.strftime("%Y-%m-%d %H:%M"),
                history.actor.username if history.actor else "",
                getattr(history.order.product.brand, 'name', ''),
                getattr(history.order.product.category, 'name', ''),
                getattr(history.order.product.subcategory, 'name', ''),
                getattr(history.order, 'quantity', ''),
                getattr(history.order.product, 'actual_rate', ''),
                getattr(history.order, 'accepted_price', ''),
                history.action,
                getattr(history.order, 'total_amount', ''),
            ])

        return response
    

class VendorSalesReportView(APIView):
    permission_classes = [IsAdminOrVendorRole]
    pagination_class = MyOrdersPagination

    def get(self, request):
        user = request.user
        range_filter = request.query_params.get('range', 'today')
        search_term = request.query_params.get('search', '')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        # Date filtering
        today = now().date()
        if start_date and end_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format'}, status=400)
        else:
            if range_filter == 'last_month':
                start_date = today - timedelta(days=30)
            elif range_filter == 'this_week':
                start_date = today - timedelta(days=7)
            else:  # 'today'
                start_date = today
            end_date = today

        # Base query - use __range for date filtering
        sales = Sale.objects.filter(
            seller=user, 
            sale_date__range=(start_date, end_date)
        )

        # Search filtering
        if search_term:
            sales = sales.filter(product__name__icontains=search_term)

        # Search filtering
        if search_term:
            sales = sales.filter(product__name__icontains=search_term)

        # Get summary stats for charts
        summary_stats = sales.aggregate(
            total_sales=Sum('total_price'),
            total_quantity=Sum('quantity'),
            total_orders=Count('order', distinct=True)
        )

        # Get daily sales data for line chart
        daily_sales = sales.values('sale_date').annotate(
            daily_total=Sum('total_price'),
            daily_quantity=Sum('quantity')
        ).order_by('sale_date')

        # Get top products for bar chart
        top_products = sales.values('product__name').annotate(
            product_total=Sum('total_price'),
            product_quantity=Sum('quantity')
        ).order_by('-product_total')[:5]

        # Serialize data
        serializer = SaleSerializer(
            sales, 
            many=True, 
            context={'request': request}
        )

        response_data = {
            'sales': serializer.data,
            'summary': summary_stats,
            'charts': {
                'daily_sales': list(daily_sales),
                'top_products': list(top_products)
            }
        }

        return Response(response_data)

class VendorSalesExportCSVView(APIView):
    permission_classes = [IsVendorRole]

    EXPORT_COLUMNS = [
        ('order_date', 'Order Date'),
        ('product_name', 'Product'),
        ('product_size', 'Variant'),
        ('quantity', 'Quantity'),
        ('price', 'Unit Price'),
        ('discount', 'Discount'),
        ('total_price', 'Total Price'),
    ]

    def get_date_range(self, range_filter, start_date, end_date):
        today = now().date()

        if start_date and end_date:
            try:
                return (
                    datetime.strptime(start_date, '%Y-%m-%d').date(),
                    datetime.strptime(end_date, '%Y-%m-%d').date()
                )
            except ValueError:
                raise ValueError("Invalid date format")

        if range_filter == 'last_month':
            return (today - timedelta(days=30), today)
        elif range_filter == 'this_week':
            return (today - timedelta(days=7), today)

        return today, today  # default: today only

    def get(self, request):
        try:
            user = request.user
            range_filter = request.query_params.get('range', 'today')
            search_term = request.query_params.get('search', '')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')

            start_date, end_date = self.get_date_range(range_filter, start_date, end_date)

            sales_query = Sale.objects.filter(
                seller=user,
                sale_date__range=(start_date, end_date)
            )

            if search_term:
                sales_query = sales_query.filter(product__name__icontains=search_term)

            serializer = SaleSerializer(sales_query, many=True, context={'request': request})
            data = serializer.data

            output = StringIO()
            writer = csv.writer(output)

            # Write header
            writer.writerow([col[1] for col in self.EXPORT_COLUMNS])

            # Write each sale row
            for sale in data:
                row = [sale.get(col[0], '') for col in self.EXPORT_COLUMNS]
                writer.writerow(row)

            output.seek(0)

            filename = get_valid_filename(f"sales_report_{start_date}_to_{end_date}.csv")
            response = HttpResponse(output.getvalue(), content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        except ValueError as e:
            return Response({'error': str(e)}, status=400)
        except Exception as e:
            return Response({'error': f'Failed to generate report: {str(e)}'}, status=500)