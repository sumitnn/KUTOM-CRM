from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import *
from .serializers import *
from django.utils.timezone import now
from accounts.permissions import IsAdminRole, IsStockistRole, IsVendorRole
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
        import pdb; pdb.set_trace()
        queryset = Order.objects.filter(created_by=user)

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
        
        if request.user.role == 'vendor':
            return Response({"message": "You don’t have access to order items."}, status=400)

        if not isinstance(items_data, list) or not items_data:
            return Response({"message": "Invalid or empty 'items' list."}, status=400)

        try:
            order, total_price = OrderService.create_bulk_order(request.user, items_data)
            return Response(
                {
                    "message": "Order created successfully.",
                    "order_id": order.id,
                    "total_deducted": total_price
                },
                status=status.HTTP_201_CREATED
            )

        except ValidationError as e:
            # Handles DRF ValidationError which might have a dictionary or string inside
            error_detail = e.detail if hasattr(e, 'detail') else str(e)

            if isinstance(error_detail, dict):
                # For structured error responses (field-level errors)
                flat_errors = [str(msg) for messages in error_detail.values() for msg in messages]
                error_message = flat_errors[0] if flat_errors else "Invalid input."
            else:
                # For plain string messages
                error_message = str(error_detail)

            # Normalize specific known messages
            if "Insufficient wallet balance" in error_message:
                error_message = "Insufficient balance"

            return Response({"message": error_message}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
        filter_type = request.query_params.get('filter', 'all')
        today = timezone.now().date()

        filters = {
            'approved': Q(status='approved'),
            'rejected': Q(status='rejected'),
            'today': Q(created_at__date=today,status="forwarded"),
        }

        filter_q = filters.get(filter_type, Q())
        orders = Order.objects.filter(filter_q).order_by('-created_at')

        paginator = PageNumberPagination()
        paginated_orders = paginator.paginate_queryset(orders, request)
        serializer = OrderSerializer(paginated_orders, many=True)
        return paginator.get_paginated_response(serializer.data)


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
        orders = Order.objects.filter(reseller=user)

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
    

class UpdateOrderStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        if order.stockist != request.user:
            return Response({"detail": "You are not authorized to update this order."}, status=status.HTTP_403_FORBIDDEN)

        serializer = OrderStatusUpdateSerializer(order, data=request.data, partial=True)
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
                history.actor.get_full_name() if history.actor else "",
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