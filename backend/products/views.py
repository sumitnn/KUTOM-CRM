from rest_framework import viewsets
from .models import Brand
from .serializers import *
from accounts.permissions import IsAdminOrResellerRole,IsAdminOrVendorRole,IsVendorRole
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Sum,Q
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.generics import ListAPIView
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from datetime import datetime



class BrandListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search_query = request.query_params.get('search', '').strip().lower()

        brands = Brand.objects.all()
        if search_query:
            brands = brands.filter(Q(name__icontains=search_query))

        serializer = BrandSerializer(brands, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        user_role = getattr(request.user, 'role', None)

        if user_role not in ['admin', 'vendor']:
            return Response(
                {"message": "You do not have permission to create a brand.", "status": False},
                status=status.HTTP_403_FORBIDDEN
            )

        brand_name = request.data.get('name', '').strip().lower()

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

class MainCategoryAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, pk=None):
        if pk:
            category = get_object_or_404(MainCategory, pk=pk)
            serializer = MainCategorySerializer(category, context={'request': request})
            return Response(serializer.data)
        else:
            search_query = request.query_params.get('search', '').strip()
            queryset = MainCategory.objects.all()
                
            if search_query:
                queryset = queryset.filter(name__icontains=search_query)
            serializer = MainCategorySerializer(queryset, many=True, context={'request': request})
            return Response(serializer.data)

    def post(self, request):
        
        if request.user.role not in ["admin", "vendor"]:
            return Response({"message": "Not authorized to create main category.", "status": False}, status=status.HTTP_403_FORBIDDEN)

        cat_name = request.data.get('name', '').strip().lower()
        if MainCategory.objects.filter(name__iexact=cat_name).exists():
            return Response({"message": "A Main Category with this name already exists.", "status": False}, status=status.HTTP_400_BAD_REQUEST)

        serializer = MainCategorySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        if not pk:
            return Response({"detail": "Main Category id is required for update."}, status=status.HTTP_400_BAD_REQUEST)
        
        category = get_object_or_404(MainCategory, pk=pk)

        if not (request.user.role == "admin" or category.owner == request.user):
            return Response({"message": "Not authorized to update this category.","status":False}, status=status.HTTP_403_FORBIDDEN)

        serializer = MainCategorySerializer(category, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        if not pk:
            return Response({"detail": "Main Category id is required for delete."}, status=status.HTTP_400_BAD_REQUEST)

        category = get_object_or_404(MainCategory, pk=pk)

        if not (request.user.role == "admin" or category.owner == request.user):
            return Response({"detail": "Not authorized to delete this category."}, status=status.HTTP_403_FORBIDDEN)

        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class CategoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk:
            category = get_object_or_404(Category, pk=pk)
            serializer = CategorySerializer(category, context={'request': request})
            return Response(serializer.data)
        else:
            search_query = request.query_params.get('search', '').strip()
            queryset = Category.objects.all()
                
            if search_query:
                queryset = queryset.filter(name__icontains=search_query)

            serializer = CategorySerializer(queryset, many=True, context={'request': request})
            return Response(serializer.data)

    def post(self, request):
        if request.user.role not in ["admin", "vendor"]:
            return Response(
                {"message": "Not authorized to create category.", "status": False},
                status=status.HTTP_403_FORBIDDEN
            )

        cat_name = request.data.get('name', '').strip().lower()
        if Category.objects.filter(name__iexact=cat_name).exists():
            return Response(
                {"message": "A Category with this name already exists.", "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CategorySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk=None):
        if not pk:
            return Response(
                {"detail": "Category id is required for update."},
                status=status.HTTP_400_BAD_REQUEST
            )

        category = get_object_or_404(Category, pk=pk)

        if not (request.user.role == "admin" or category.owner == request.user):
            return Response(
                {"message": "Not authorized to update this category.", "status": False},
                status=status.HTTP_403_FORBIDDEN
            )
        update_data = request.data.get("data", request.data)

        serializer = CategorySerializer(
            category,
            data=update_data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        if not pk:
            return Response(
                {"detail": "Category id is required for delete."},
                status=status.HTTP_400_BAD_REQUEST
            )

        category = get_object_or_404(Category, pk=pk)

        if not (request.user.role == "admin" or category.owner == request.user):
            return Response(
                {"detail": "Not authorized to delete this category."},
                status=status.HTTP_403_FORBIDDEN
            )

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
            search_query = request.query_params.get('search', '').strip()
            queryset = SubCategory.objects.all()  
            if search_query:
                queryset = queryset.filter(name__icontains=search_query)
            serializer = SubCategorySerializer(queryset, many=True, context={'request': request})
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



class ProductListCreateAPIView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrVendorRole()]
        return [IsAuthenticated()]

    def get(self, request):
        # Get query parameters
        search = request.query_params.get('search', None)
        category = request.query_params.get('category', None)
        product_type = request.query_params.get('type', None)
        featured = request.query_params.get('featured', None)
        
        # Start with all products
        products = Product.objects.all()
        
        # Apply filters if provided
        if search:
            products = products.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(sku__icontains=search) |
                Q(tags__name__icontains=search)
            ).distinct()
        
        if category:
            products = products.filter(category_id=category)
            
        if product_type:
            products = products.filter(product_type=product_type)
            
        if featured:
            products = products.filter(is_featured=True)

        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()

        # Truncate short_description if too long
        if 'short_description' in data and len(data['short_description']) > 160:
            data['short_description'] = data['short_description'][:160]


        # Safely load JSON fields
        for field in ['tags', 'features', 'sizes', 'price_tiers']:
            if field in data:
                value = data.get(field)
                if isinstance(value, str):
                    try:
                        if field =="features":
                             data[field] =value
                        else:

                            data[field] = json.loads(value)
                    except (json.JSONDecodeError, TypeError):
                        return Response(
                            {field: "Invalid JSON format"},
                            status=status.HTTP_400_BAD_REQUEST
                        )

        # Create product
        serializer = ProductSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            product = serializer.save(owner=request.user)

            if 'tags' in data and isinstance(data['tags'], list):
                tag_ids = []
                for tag_name in data['tags']:
                    tag_obj, _ = Tag.objects.get_or_create(name=tag_name, defaults={'owner': request.user})
                    tag_ids.append(tag_obj.id)
                product.tags.set(tag_ids)

            # Save main images
            if 'image' in request.FILES:
                for img in request.FILES.getlist('image'):
                    ProductImage.objects.create(
                        product=product,
                        image=img,
                        is_featured=True,
                        is_default=True
                    )

            # Save additional images
            if 'additional_images' in request.FILES:
                for img in request.FILES.getlist('additional_images'):
                    ProductImage.objects.create(
                        product=product,
                        image=img,
                        is_featured=True,
                        is_default=False
                    )
            
            # Save sizes and track them by index
            saved_sizes = []
            if 'sizes' in data and isinstance(data['sizes'], list):
                for size_data in data['sizes']:
                    size_serializer = ProductSizeSerializer(data=size_data)
                    if size_serializer.is_valid():
                        size_instance = size_serializer.save(product=product)
                        saved_sizes.append(size_instance)
                    else:
                        return Response(size_serializer.errors, status=400)

            # Save price tiers with size reference using sizeIndex
            if 'price_tiers' in data and isinstance(data['price_tiers'], list):
                for tier_data in data['price_tiers']:
                    size_index = tier_data.get('sizeIndex')
                    if size_index is None or size_index >= len(saved_sizes):
                        return Response(
                            {"price_tiers": f"Invalid sizeIndex: {size_index}"},
                            status=400
                        )
                    tier_serializer = ProductPriceTierSerializer(data=tier_data)
                    if tier_serializer.is_valid():
                        tier_serializer.save(
                            product=product,
                            size=saved_sizes[size_index]
                        )
                    else:
                        return Response(tier_serializer.errors, status=400)

            return Response(
                ProductSerializer(product, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class ProductDetailAPIView(APIView):
    permission_classes = [IsAdminOrVendorRole]

    def get_object(self, pk):
        return get_object_or_404(Product.objects.prefetch_related(
            'images', 'sizes', 'price_tiers', 'tags'
        ), pk=pk)

    def get(self, request, pk):
        
        product = self.get_object(pk)
        self.check_object_permissions(request, product)
        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        product = self.get_object(pk)
        data = request.data.copy()
        
        self.check_object_permissions(request, product)
        
        # Truncate short_description if too long
        if 'short_description' in data and len(data['short_description']) > 160:
            data['short_description'] = data['short_description'][:160]

        # Safely load JSON fields
        for field in ['tags', 'features', 'sizes', 'price_tiers']:
            if field in data:
                value = data.get(field)
                if isinstance(value, str):
                    try:
                        if field == "features":
                            data[field] = value
                        else:
                            data[field] = json.loads(value)
                    except (json.JSONDecodeError, TypeError):
                        return Response(
                            {field: "Invalid JSON format"},
                            status=status.HTTP_400_BAD_REQUEST
                        )

        serializer = ProductSerializer(
            product, 
            data=data, 
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            product = serializer.save()
            
            # Handle tags update
            if 'tags' in data and isinstance(data['tags'], list):
                tag_ids = []
                for tag_name in data['tags']:
                    tag_obj, _ = Tag.objects.get_or_create(name=tag_name, defaults={'owner': request.user})
                    tag_ids.append(tag_obj.id)
                product.tags.set(tag_ids)
            
            # Handle image updates
            if 'image' in request.FILES:
                old_images = product.images.filter(is_default=True)
                for img in old_images:
                    img.image.delete(save=False)
                old_images.delete()
                for img in request.FILES.getlist('image'):
                    ProductImage.objects.create(
                        product=product,
                        image=img,
                        is_featured=True,
                        is_default=True
                    )
            
            # Handle additional images
            if 'additional_images' in request.FILES:
                old_additional_images = product.images.filter(is_default=False)
                for img in old_additional_images:
                    img.image.delete(save=False)
                old_additional_images.delete()
                for img in request.FILES.getlist('additional_images'):
                    ProductImage.objects.create(
                        product=product,
                        image=img,
                        is_featured=True,
                        is_default=False
                    )
            
            # Handle sizes updates - FIRST PASS: Create all sizes
            saved_sizes = []
            if 'sizes' in data and isinstance(data['sizes'], list):
                # First pass: Create all sizes without setting defaults
                temp_sizes = []
                for size_data in data['sizes']:
                    size_data = size_data.copy()
                    # Include the product ID in the data
                    size_data['product'] = product.id
                    # Temporarily set is_default to False during creation
                    original_default = size_data.pop('is_default', False)
                    size_serializer = ProductSizeSerializer(data=size_data)
                    if size_serializer.is_valid():
                        size_instance = size_serializer.save()
                        temp_sizes.append((size_instance, original_default))
                    else:
                        return Response(
                            {'sizes': size_serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                # Second pass: Now that all sizes have PKs, set the correct defaults
                for size_instance, original_default in temp_sizes:
                    if original_default:
                        size_instance.is_default = True
                        size_instance.save()
                    saved_sizes.append(size_instance)
            
            # Handle price tiers updates (only after all sizes have been created)
            if 'price_tiers' in data and isinstance(data['price_tiers'], list):
                product.price_tiers.all().delete()
                for tier_data in data['price_tiers']:
                    size_index = tier_data.get('sizeIndex')
                    if size_index is None or size_index >= len(saved_sizes):
                        return Response(
                            {"price_tiers": f"Invalid sizeIndex: {size_index}"},
                            status=400
                        )
                    
                    # Create a copy of tier_data to modify
                    tier_data = tier_data.copy()
                    # Include required fields
                    tier_data['product'] = product.id
                    tier_data['size'] = saved_sizes[size_index].id
                    
                    tier_serializer = ProductPriceTierSerializer(data=tier_data)
                    if tier_serializer.is_valid():
                        tier_serializer.save()
                    else:
                        return Response(
                            {'price_tiers': tier_serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST
                        )

            return Response(
                ProductSerializer(product, context={'request': request}).data,
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        product = self.get_object(pk)
        self.check_object_permissions(request, product)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductStatusUpdateView(APIView):
    permission_classes = [IsVendorRole]

    def get_object(self, pk):
        return get_object_or_404(Product, pk=pk)

    def put(self, request, pk):
        product = self.get_object(pk)
        self.check_object_permissions(request, product)
        
        # Get status from request data
        new_status = request.data.get('status')

        if new_status not in ['active', 'inactive']:
            return Response(
                {'message': 'Status must be either "active" or "inactive"', "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update is_featured based on status
        product.is_featured = (new_status == 'active')
        product.save()

        return Response(
            {
                'message': 'Product feature status updated successfully.',
                "status": True
            },
            status=status.HTTP_200_OK
        )

class ProductByStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        status_param = request.query_params.get('status')
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 10)

        if not status_param:
            return Response(
                {'message': 'Status query parameter is required.', "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            page = int(page)
            page_size = int(page_size)
        except ValueError:
            return Response(
                {'message': 'Invalid page or page_size parameter.', "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Define queryset based on status
        if status_param == 'draft':
            products = Product.objects.filter(status='draft')
        elif status_param == 'published':
            products = Product.objects.filter(status='published')
        elif status_param == 'active':
            products = Product.objects.filter(status='published', is_featured=True)
        elif status_param == 'inactive':
            products = Product.objects.filter(status='published', is_featured=False)
        else:
            return Response(
                {'message': 'Invalid status parameter.', "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Pagination
        paginator = PageNumberPagination()
        paginator.page_size = page_size
        paginated_products = paginator.paginate_queryset(products, request)
        
        serializer = ProductSerializer(
            paginated_products,
            many=True,
            context={'request': request}
        )
        
        return paginator.get_paginated_response(serializer.data)

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
    



class VendorActiveProductListView(generics.ListAPIView):
    serializer_class = ProductDropdownSerializer
    permission_classes = [IsVendorRole]
    pagination_class=None

    def get_queryset(self):
        return Product.objects.filter(is_featured=True, owner=self.request.user)

# View to fetch all sizes for a selected product
class ProductSizeListByProductView(generics.ListAPIView):
    serializer_class = ProductSizeSerializer
    permission_classes = [IsVendorRole]
    pagination_class=None

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return ProductSize.objects.filter(product_id=product_id, is_active=True)
    

class StockListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsVendorRole()]
        return super().get_permissions()

    def get(self, request):
        user = request.user
        queryset = Stock.objects.filter(owner=user)

        product = request.query_params.get('product')
        status_param = request.query_params.get('status')

        if product:
            queryset = queryset.filter(product=product)

        if status_param:
            today = datetime.now().date()
            if status_param == "new_stock":
                queryset = queryset.filter(created_at__date=today)
            elif status_param == "in_stock":
                queryset = queryset.filter(status='in_stock').exclude(created_at__date=today)
            elif status_param == "out_of_stock":
                queryset = queryset.filter(status='out_of_stock')


        serializer = StockSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = StockSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [IsVendorRole]