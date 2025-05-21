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
        # Get the filter type from query parameters
        filter_type = request.query_params.get('filter', 'all')

        today = timezone.now().date()

        if filter_type == 'approved':
            orders = Order.objects.filter(status='approved')
        elif filter_type == 'rejected':
            orders = Order.objects.filter(status='rejected')
        elif filter_type == 'today':
            orders = Order.objects.filter(created_at__date=today)
        else:  # 'all'
            orders = Order.objects.all()

        serializer = OrderSerializer(orders, many=True)
        return Response({"success": True, "data": serializer.data})

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