from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order
from .serializers import OrderSerializer
from django.utils.timezone import now
from accounts.permissions import IsAdminRole, IsStockistRole, IsVendorRole
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.pagination import PageNumberPagination



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





# Admin-specific filters
class AdminOrderListView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        filter_type = request.query_params.get('filter', 'all')
        today = timezone.now().date()

        filters = {
            'approved': Q(status='approved'),
            'rejected': Q(status='rejected'),
            'today': Q(created_at__date=today),
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