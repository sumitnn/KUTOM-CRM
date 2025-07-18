from django.urls import path
from .views import *

urlpatterns = [
    path('orders/create/', CreateOrderAPIView.as_view()),
    path('orders/stockist/', StockistOrderListAPIView.as_view()),
    path('orders/forward/<int:pk>/', ForwardOrderAPIView.as_view()),
    path('orders/admin/', AdminOrderListView.as_view()),
    path('orders/admin/action/<int:pk>/', AdminApproveRejectOrderAPIView.as_view()),
    path('orders/my-orders/', MyOrdersView.as_view(), name='my-orders'),
    path('orders/vendor/my-orders/', VendorOrdersView.as_view(), name='vendor-orders'),
    path('orders/bulk-create/', BulkOrderCreateView.as_view(), name='bulk-order-create'),
    path('orders/<int:order_id>/', OrderDetailAPIView.as_view(), name='order-detail'),

    path('orders/summary/', OrderSummaryView.as_view(), name='order-summary'),
     path('orders-update-status/<int:pk>/', UpdateOrderStatusView.as_view(), name='update-order-status'),
     path('orders/<int:pk>/dispatch/', UpdateOrderDispatchStatusView.as_view(), name='update-order-dispatch-status'),

      path('order-history/', OrderHistoryListAPIView.as_view(), name='order-history-list'),
    path('order-history/export/', ExportOrderHistoryExcelAPIView.as_view(), name='order-history-export'),
    # sales 
    path('sales/vendor/', VendorSalesReportView.as_view(), name='vendor-sales'),
    path('sales/vendor/export/', VendorSalesExportCSVView.as_view(), name='vendor-sales-export'),

]