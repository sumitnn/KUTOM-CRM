from django.urls import path
from .views import *

urlpatterns = [
    path('orders/create/', CreateOrderAPIView.as_view()),
    path('orders/stockist/', StockistOrderListAPIView.as_view()),
    path('orders/forward/<int:pk>/', ForwardOrderAPIView.as_view()),
    path('orders/admin/', AdminOrderListView.as_view()),
    path('orders/admin/action/<int:pk>/', AdminApproveRejectOrderAPIView.as_view()),
]