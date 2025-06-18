from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

# router = DefaultRouter()


urlpatterns = [
    # path('', include(router.urls)),
    path('brands/', BrandListCreateAPIView.as_view(), name='brand-list-create'),
    path('brands/<int:pk>/', BrandDetailAPIView.as_view(), name='brand-detail'),

    path('categories/', CategoryAPIView.as_view()),
    path('categories/<int:pk>/', CategoryAPIView.as_view()),
    path('subcategories/', SubcategoryAPIView.as_view()),
    path('subcategories/<int:pk>/', SubcategoryAPIView.as_view()),

    path('products/', ProductListCreateAPIView.as_view(), name='product-list-create'),
    path('products/<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),
    path("products/my-products/", MyProductListAPIView.as_view(), name="my-products"),
    path('products/stats/', ProductStatsView.as_view(), name='product-stats'),
    path('products/by-status/', ProductByStatusAPIView.as_view(), name='product-by-status'),


    # stocks 
    path('stocks/', StockListCreateAPIView.as_view(), name='stock-list-create'),
    path('stocks/<int:pk>/', StockRetrieveUpdateAPIView.as_view(), name='stock-detail'),
]