from rest_framework import viewsets
from .models import Brand
from .serializers import *
from accounts.permissions import IsAdminOrResellerRole,IsAdminOrVendorRole
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Sum
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.generics import ListAPIView



class BrandListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        brands = Brand.objects.all()
        serializer = BrandSerializer(brands, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        user_role = getattr(request.user, 'role', None)

        # Only allow 'admin' or 'vendor' to create a brand
        if user_role not in ['admin', 'vendor']:
            return Response(
                {"message": "You do not have permission to create a brand.", "status": False},
                status=status.HTTP_403_FORBIDDEN
            )

        brand_name = request.data.get('name', '').strip().lower()

        # Check for case-insensitive duplicate brand name
        if Brand.objects.filter(name__iexact=brand_name).exists():
            return Response(
                {"message": "A brand with this name already exists.", "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data.copy()
        data['name'] = brand_name  

        serializer = BrandSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BrandDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self, pk):
        return get_object_or_404(Brand, pk=pk)

    def has_permission(self, request, brand):
        user_role = getattr(request.user, 'role', None)
        return user_role == 'admin' or brand.owner == request.user

    def get(self, request, pk):
        brand = self.get_object(pk)
        serializer = BrandSerializer(brand, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        brand = self.get_object(pk)

        if not self.has_permission(request, brand):
            return Response(
                {"detail": "You do not have permission to update this brand."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BrandSerializer(
            brand,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        brand = self.get_object(pk)

        if not self.has_permission(request, brand):
            return Response(
                {"detail": "You do not have permission to delete this brand."},
                status=status.HTTP_403_FORBIDDEN
            )

        brand.delete()
        return Response(
            {"detail": "Brand deleted successfully."},
            status=status.HTTP_204_NO_CONTENT
        )




class CategoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk:
            category = get_object_or_404(Category, pk=pk)
            serializer = CategorySerializer(category, context={'request': request})
            return Response(serializer.data)
        else:
            categories = Category.objects.all()
            serializer = CategorySerializer(categories, many=True, context={'request': request})
            return Response(serializer.data)

    def post(self, request):
        if request.user.role not in ["admin", "vendor"]:
            return Response({"message": "Not authorized to create category.", "status": False}, status=status.HTTP_403_FORBIDDEN)

        cat_name = request.data.get('name', '').strip().lower()
        if Category.objects.filter(name__iexact=cat_name).exists():
            return Response({"message": "A Category with this name already exists.", "status": False}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CategorySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        if not pk:
            return Response({"detail": "Category id is required for update."}, status=status.HTTP_400_BAD_REQUEST)

        category = get_object_or_404(Category, pk=pk)

        if not (request.user.role == "admin" or category.owner == request.user):
            return Response({"message": "Not authorized to update this category.","status":False}, status=status.HTTP_403_FORBIDDEN)

        serializer = CategorySerializer(category, data=request.data.get("data", {}), partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        if not pk:
            return Response({"detail": "Category id is required for delete."}, status=status.HTTP_400_BAD_REQUEST)

        category = get_object_or_404(Category, pk=pk)

        if not (request.user.role == "admin" or category.owner == request.user):
            return Response({"detail": "Not authorized to delete this category."}, status=status.HTTP_403_FORBIDDEN)

        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SubcategoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):

        if pk:
            category = get_object_or_404(Category, pk=pk)
            subcategories = SubCategory.objects.filter(category=category).order_by('name')

            if not subcategories.exists():
                return Response({"message": "No subcategories found for this category.","status":False}, status=404)

            serializer = SubCategorySerializer(subcategories, many=True, context={'request': request})
            return Response(serializer.data)
        else:
            subcategories = SubCategory.objects.all().order_by('name')
            serializer = SubCategorySerializer(subcategories, many=True, context={'request': request})
            return Response(serializer.data)

    def post(self, request):
        if request.user.role not in ["admin", "vendor"]:
            return Response({"message": "Not authorized to create subcategory.","status":False}, status=status.HTTP_403_FORBIDDEN)

        cat_id = request.data.get('category')
        name = request.data.get('name', '').strip().lower()
        brand_id= request.data.get('brand')

        if not cat_id:
            return Response({"message": "Subcategory must have a parent category.","status":False}, status=status.HTTP_400_BAD_REQUEST)
        
        if not brand_id:
            return Response({"message": "Subcategory must have a brand.","status":False}, status=status.HTTP_400_BAD_REQUEST)

        if SubCategory.objects.filter(category_id=cat_id, name__iexact=name,brand_id=brand_id).exists():
            return Response({"message": "A Subcategory with this name already exists under this category.", "status": False}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SubCategorySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):

        if not pk:
            return Response({"detail": "Subcategory id is required for update."}, status=status.HTTP_400_BAD_REQUEST)

        subcategory = get_object_or_404(SubCategory, pk=pk)

        if not (request.user.role == "admin" or subcategory.owner == request.user):
            return Response({"detail": "Not authorized to update this subcategory."}, status=status.HTTP_403_FORBIDDEN)

        serializer = SubCategorySerializer(subcategory, data=request.data.get("data",{}), partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        if not pk:
            return Response({"detail": "Subcategory id is required for delete."}, status=status.HTTP_400_BAD_REQUEST)

        subcategory = get_object_or_404(SubCategory, pk=pk)

        if not (request.user.role == "admin" or subcategory.owner == request.user):
            return Response({"detail": "Not authorized to delete this subcategory."}, status=status.HTTP_403_FORBIDDEN)

        subcategory.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ProductListCreateAPIView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrVendorRole()]
        return [IsAuthenticated()]

    def get(self, request):
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request):
        print("Request Data:", request.data)  # Debugging line

        serializer = ProductSerializer(data=request.data,context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProductListNotApprovedAPIView(APIView):

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrVendorRole]
        return [IsAdminOrVendorRole]

    def get(self, request):
        products = Product.objects.filter(approved_by_Admin=False)
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    def post(self, request):

        print("Request Data:", request.data)  
        serializer = ProductSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProductDetailAPIView(APIView):
    permission_classes = [IsAdminOrVendorRole]

    def get_object(self, pk):
        return get_object_or_404(Product, pk=pk)

    def get(self, request, pk):
        product = self.get_object(pk)
        self.check_object_permissions(request, product)
        serializer = ProductSerializer(product)
        return Response(serializer.data)

    def put(self, request, pk):
        product = self.get_object(pk)
        print("Request Data:", request.data)  # Debugging line
        self.check_object_permissions(request, product)
        serializer = ProductSerializer(product, data=request.data, partial=True,context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        product = self.get_object(pk)
        self.check_object_permissions(request, product)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    


class ProductByStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_param = request.query_params.get('status')

        if not status_param:
            return Response({'message': 'Status query parameter is required.',"status":False}, status=status.HTTP_400_BAD_REQUEST)

        products = Product.objects.filter(status=status_param)
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class MyProductListAPIView(APIView):
    permission_classes = [IsAdminOrVendorRole]

    def get(self, request):
        products = Product.objects.filter(owner=request.user)
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    
class ProductStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        products = Product.objects.filter(owner=user)

        labels = []
        data = []

        for product in products:
            labels.append(product.name or product.sku)
            total_quantity = (
                Product.objects
                .filter(product=product)
                .aggregate(total=Sum('quantity'))['total'] or 0
            )
            data.append(total_quantity)

        return Response({
            'labels': labels,
            'data': data,
        })
    

class StockListAPIView(ListAPIView):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'product': ['exact'],
        'status': ['exact'],
        'created_at': ['gte', 'lte'],
        'expected_date': ['gte', 'lte'],
    }
    search_fields = ['product__name', 'product__brand__name', 'notes']
    ordering_fields = ['created_at', 'updated_at', 'expected_date', 'quantity']
    ordering = ['-created_at']