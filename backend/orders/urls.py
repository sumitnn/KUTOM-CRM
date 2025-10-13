from django.urls import path
from .views import *

urlpatterns = [
    path('orders/create/', CreateOrderAPIView.as_view()),
    path('orders/stockist/', StockistOrderManagementView.as_view()),
    path('orders/forward/<int:pk>/', StockistOrderManagementView.as_view()),
    path('orders/admin/', AdminOrderListView.as_view()),
    path('orders/admin/action/<int:pk>/', UpdateOrderStatusView.as_view()),
    path('orders/my-orders/', MyOrdersView.as_view(), name='my-orders'),
    path('orders/vendor/my-orders/', VendorOrdersView.as_view(), name='vendor-orders'),
    path('orders/bulk-create/', BulkOrderCreateView.as_view(), name='bulk-order-create'),
    path('orders/<int:order_id>/', OrderDetailAPIView.as_view(), name='order-detail'),
    path('admin-product-orders/<int:pk>/', UpdateOrderStatusView.as_view(), name='adminproduct-order-detail'),
    path('orders/<int:order_id>/cancel/', CancelOrderAPIView.as_view(), name='cancel-order'),

    path('orders/summary/', OrderSummaryView.as_view(), name='order-summary'),
     path('orders-update-status/<int:pk>/', UpdateOrderStatusView.as_view(), name='update-order-status'),
     path('reseller-order-status/<int:pk>/', ResellerOrderStatusMange.as_view(), name='reseller-order-status'),
     path('common-orders-update-status/<int:pk>/', UpdateOrderStatusView.as_view(), name='update-stockist-reseller-order-status'),
     path('orders/<int:pk>/dispatch/', UpdateOrderDispatchStatusView.as_view(), name='update-order-dispatch-status'),

      path('order-history/', OrderHistoryListAPIView.as_view(), name='order-history-list'),
    path('order-history/export/', SalesReportView.as_view(), name='order-history-export'),
    # sales 
    path('sales/vendor/', SalesReportView.as_view(), name='vendor-sales'),
    path('sales/vendor/export/', SalesExportCSVView.as_view(), name='vendor-sales-export'),

     path('new-order-requests/', OrderRequestListCreateView.as_view(), name='order-request-list'),
     path('reseller-order-requests/', ResellerOrderRequestListCreateView.as_view(), name='reseller-order-request-list'),
    path('order-requests/<int:pk>/', OrderRequestDetailView.as_view(), name='order-request-detail'),
    path('reseller-order-requests/<int:pk>/', ResellerOrderRequestDetailView.as_view(), name='reseller-order-request-detail'),
    path('order-requests/<int:pk>/update-status/', update_order_request_status, name='order-request-update-status'),
    path('reseller-order-requests/<int:pk>/update-status/', UpdateOrderRequestStatusView.as_view(), name='reseller-order-request-update-status'),
    
    # Requests by status
    path('order-requests/status/<str:status>/', get_requests_by_status, name='order-requests-by-status'),
    path('reseller-order-requests/status/<str:status>/', get_reseller_order_requests_by_status, name='reseller-order-requests-by-status'),

    path('order-requests/report/', OrderRequestReportView.as_view(), name='order-requests-report'),
    path('order-requests/export/', OrderRequestExportCSVView.as_view(), name='order-requests-export'),

    # customer 
    path('customer/products/', ResellerProductsList.as_view(), name='product-list'),
    path('customer/varaints/', ResellerVaraintsList.as_view(), name='variant-list'),
    path('customer/purchases/', CustomerPurchaseListPaginatedView.as_view(), name='purchase-list'),
    path('customer/purchases/create/', CustomerPurchaseCreateView.as_view(), name='purchase-create'),
    path('customer/purchases/<uuid:id>/', CustomerPurchaseDetailView.as_view(), name='purchase-detail'),

]