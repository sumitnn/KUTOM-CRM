from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()


router.register(r'products', ProductViewSet)
router.register(r'variants', ProductVariantViewSet)
router.register(r'product-images', ProductImageViewSet)




urlpatterns = [
    path('', include(router.urls)),
    path('brands/', BrandListCreateAPIView.as_view(), name='brand-list-create'),
    path('brands/<int:pk>/', BrandDetailAPIView.as_view(), name='brand-detail'),
    path('categories/', CategoryAPIView.as_view()),
    path('categories/<int:pk>/', CategoryAPIView.as_view()),
    path('subcategories/', SubcategoryAPIView.as_view()),
    path('subcategories/<int:pk>/', SubcategoryAPIView.as_view()),
]