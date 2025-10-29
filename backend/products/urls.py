from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

# router = DefaultRouter()


urlpatterns = [
    # path('', include(router.urls)),
    path('brands/', BrandListCreateAPIView.as_view(), name='brand-list-create'),
    path('brands/<int:pk>/', BrandDetailAPIView.as_view(), name='brand-detail'),

    path('main-categories/', MainCategoryAPIView.as_view()),
    path('main-categories/<int:pk>/', MainCategoryAPIView.as_view()),

    path('categories/', CategoryAPIView.as_view()),
    path('categories/<int:pk>/', CategoryAPIView.as_view()),
    path('subcategories/', SubcategoryAPIView.as_view()),
    path('subcategories/<int:pk>/', SubcategoryAPIView.as_view()),

    path('products/', ProductListCreateAPIView.as_view(), name='product-list-create'),
    path('products/<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),
    path('products/<int:pk>/status/', ProductStatusUpdateView.as_view(), name='product-status-update'),
    path("products/my-products/", MyProductListAPIView.as_view(), name="my-products"),
    path('products/stats/', ProductStatsView.as_view(), name='product-stats'),
    path('products/by-status/', ProductByStatusAPIView.as_view(), name='product-by-status'),
    

    # vendor api 
    path('vendor/products/', ActiveProductListView.as_view(), name='vendor-product-list'),
    path('vendor/products/<int:product_id>/sizes/', ProductVariantListByProductView.as_view(), name='product-size-list'),

    # admin api 
    path('admin/products/', AdminProductListView.as_view(), name='admin-product-list'),
    path('admin/products/<int:product_id>/sizes/', AdminProductListView.as_view(), name='adminproduct-size-list'),
    path('admin-stocks/', StockListCreateAPIView.as_view(), name='adminstock-list'),
    
    # stocks 
    path('stocks/', StockListCreateAPIView.as_view(), name='stock-list-create'),
    path('stocks/<int:pk>/', StockRetrieveUpdateAPIView.as_view(), name='stock-detail'),
    path('stocks/<int:stock_id>/history/', StockHistoryAPIView.as_view(), name='get-stock-history'),

    path('commissions/<int:product_id>/',ProductCommissionDetail.as_view(),name='product-commission-detail'),
    # stockist
     path('admin-products/', AdminProductListView.as_view(), name='admin-product-list'),
     path('admin-products/<int:pk>/', AdminProductDetailAPIView.as_view(), name='admin-product-details'),
     
    path('products/<int:product_id>/commission/', ProductCommissionAPIView.as_view(), name='product-commission'),
    path('products/<int:product_id>/featured/', ProductFeaturedStatusAPIView.as_view(), name='product-featured'),
    path('products/<int:product_id>/variants/<int:variant_id>/price/', ProductPriceUpdateAPIView.as_view(), name='product-price-update'),
   
     # 🔹 Replacement Tab
    path('replacement/create/', create_replacement_request, name='create_replacement'),
    path('replacement/list/', list_replacement_requests, name='list_replacement'),
    path('replacements/<int:pk>/update-status/', update_replacement_status, name='update_replacement_status'),

    # 🔹 Expiry Tab
    path('expiry/products/', list_expiring_products, name='expiry_products'),
    path('expiry/request/create/', create_expiry_request, name='create_expiry_request')
]