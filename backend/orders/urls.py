from django.urls import path
from .views import *

urlpatterns = [
    path('orders/create/', CreateOrderAPIView.as_view()),
    path('orders/stockist/', StockistOrderListAPIView.as_view()),
    path('orders/forward/<int:pk>/', ForwardOrderAPIView.as_view()),
    path('orders/admin/', AdminOrderListView.as_view()),
    path('orders/admin/action/<int:pk>/', AdminApproveRejectOrderAPIView.as_view()),
    path('orders/my-orders/', MyOrdersView.as_view(), name='my-orders'),
    path('orders/bulk-create/', BulkOrderCreateView.as_view(), name='bulk-order-create'),

    path('orders/summary/', OrderSummaryView.as_view(), name='order-summary'),

]