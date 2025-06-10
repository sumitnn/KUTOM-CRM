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


class BrandListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        brands = Brand.objects.all()
        serializer = BrandSerializer(brands, many=True,context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        user_role = getattr(request.user, 'role', None)
        if user_role not in ['admin', 'vendor']:
            return Response(
                {"message": "You do not have permission to create a brand.","status":False},
                status=status.HTTP_403_FORBIDDEN
            )

        brand_name = request.data.get('name', '').strip().lower()
        if Brand.objects.filter(name__iexact=brand_name).exists():
            return Response(
                {"message": "A brand with this name already exists.","status":False},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = BrandSerializer(data=request.data,context={'request': request})
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
        # List all or retrieve single category
        if pk:
            category = get_object_or_404(Category, pk=pk)
            serializer = CategorySerializer(category,context={'request': request})
            return Response(serializer.data)
        else:
            categories = Category.objects.all().order_by('display_order', 'name')
            serializer = CategorySerializer(categories, many=True,context={'request': request})
            return Response(serializer.data)

    def post(self, request):

        # Only admin and vendor can create category
        if request.user.role != "admin" and request.user.role != "vendor":
            return Response({"detail": "Not authorized to create category."}, status=status.HTTP_403_FORBIDDEN)
        
        cat_name = request.data.get('name', '').strip().lower()
        if Category.objects.filter(name__iexact=cat_name).exists():
            return Response(
                {"message": "A Category with this name already exists.","status":False},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = CategorySerializer(data=request.data,context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user) 
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        if not pk:
            return Response({"detail": "Category id is required for update."}, status=status.HTTP_400_BAD_REQUEST)
        
        category = get_object_or_404(Category, pk=pk)

        # Only admin or owner can update
        if not (request.user.role == "admin" or category.owner == request.user):
            return Response({"detail": "Not authorized to update this category."}, status=status.HTTP_403_FORBIDDEN)

        serializer = CategorySerializer(category, data=request.data, partial=True,context={'request': request})
        if serializer.is_valid():
            serializer.save()  
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        if not pk:
            return Response({"detail": "Category id is required for delete."}, status=status.HTTP_400_BAD_REQUEST)
        
        category = get_object_or_404(Category, pk=pk)

        # Only admin or owner can delete
        if not (request.user.role == "admin" or category.owner == request.user):
            return Response({"detail": "Not authorized to delete this category."}, status=status.HTTP_403_FORBIDDEN)

        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class SubcategoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk:
            subcategory = get_object_or_404(Category, pk=pk, parent__isnull=False)
            serializer = SubcategorySerializer(subcategory, context={'request': request})
            return Response(serializer.data)
        else:
            subcategories = Category.objects.filter(parent__isnull=False).order_by('display_order', 'name')
            serializer = SubcategorySerializer(subcategories, many=True, context={'request': request})
            return Response(serializer.data)

    def post(self, request):
        if request.user.role != "admin" and request.user.role != "vendor":
            return Response({"detail": "Not authorized to create subcategory."}, status=status.HTTP_403_FORBIDDEN)
        
        cat_name = request.data.get('name', '').strip().lower()
        if Category.objects.filter(name__iexact=cat_name, parent__isnull=False).exists():
            return Response(
                {"message": "A Subcategory with this name already exists.","status":False},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not request.data.get('parent'):
            return Response({"detail": "Subcategory must have a parent category."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SubcategorySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        if not pk:
            return Response({"detail": "Subcategory id is required for update."}, status=status.HTTP_400_BAD_REQUEST)

        subcategory = get_object_or_404(Category, pk=pk, parent__isnull=False)

        if not (request.user.role == "admin" or subcategory.owner == request.user):
            return Response({"detail": "Not authorized to update this subcategory."}, status=status.HTTP_403_FORBIDDEN)

        serializer = SubcategorySerializer(subcategory, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        if not pk:
            return Response({"detail": "Subcategory id is required for delete."}, status=status.HTTP_400_BAD_REQUEST)

        subcategory = get_object_or_404(Category, pk=pk, parent__isnull=False)

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
        self.check_object_permissions(request, product)
        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(owner=product.owner)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        product = self.get_object(pk)
        self.check_object_permissions(request, product)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

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
                ProductVariant.objects
                .filter(product=product)
                .aggregate(total=Sum('quantity'))['total'] or 0
            )
            data.append(total_quantity)

        return Response({
            'labels': labels,
            'data': data,
        })
    

# def order_summary(request):
#     # Status counts
#     status_counts = Order.objects.values('status').annotate(count=Count('id'))
#     status_map = {'All': Order.objects.count()}
#     for item in status_counts:
#         status_map[item['status']] = item['count']

#     # Monthly orders
#     months = Order.objects.annotate(month=TruncMonth('created_at')) \
#         .values('month', 'status') \
#         .annotate(count=Count('id'))

#     # Build monthly datasets
#     label_set = set()
#     data_map = {'All': {}, 'Pending': {}, 'Approved': {}, 'Rejected': {}}
#     for entry in months:
#         month_label = entry['month'].strftime('%B')
#         label_set.add(month_label)
#         status = entry['status']
#         data_map['All'].setdefault(month_label, 0)
#         data_map[status].setdefault(month_label, 0)
#         data_map['All'][month_label] += entry['count']
#         data_map[status][month_label] += entry['count']

#     sorted_labels = sorted(label_set, key=lambda m: datetime.strptime(m, '%B').month)

#     datasets = [
#         {'label': status, 'data': [data_map[status].get(label, 0) for label in sorted_labels]}
#         for status in ['All', 'Pending', 'Approved', 'Rejected']
#     ]

#     return Response({
#         'statusCounts': status_map,
#         'monthlyOrders': {
#             'labels': sorted_labels,
#             'datasets': datasets,
#         }
#     })   