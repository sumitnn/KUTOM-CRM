from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from .serializers import *
from .utils import get_tokens_for_user  
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import User,Profile
from .permissions import IsAdminRole, IsVendorRole, IsStockistRole,IsAdminOrStockistRole
from rest_framework import generics
from django.shortcuts import get_object_or_404
from decimal import Decimal, InvalidOperation
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from datetime import datetime
from rest_framework.decorators import api_view
from django.db.models import Sum, Q,Count
from datetime import timedelta,timezone
from orders.models import Order, OrderItem
from rest_framework.pagination import PageNumberPagination
from products.models import Product
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from django.utils.timezone import make_aware
from orders.models import Sale
from .utils import create_notification



class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class RegisterView(APIView):
    # permission_classes = [AllowAny]
    permission_classes = [IsAdminRole]

    def post(self, request):
        

        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()

            return Response({
                "message": "User registered successfully",
                "success":True
 
            }, status=status.HTTP_201_CREATED)
        return Response({"message":serializer.errors,"success":False}, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        

        if not email or not password:
            return Response({
                "message": "Email and password are required",
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if NewAccountApplication.objects.filter(email=email, status="new").exists():
            return Response({"message": "You can’t log in Now. Please wait for an admin to approve your application request."}, status=200)

        user = authenticate(request, email=email, password=password)

        if user is not None:
            tokens = get_tokens_for_user(user)
            role = getattr(user, 'role', None)
            username = getattr(user, 'username', None)
            email = getattr(user, 'email', None)

            # Safely fetch profile completion
            profile_completion = 0
            profile_pic = None
            if hasattr(user, 'profile'):
                profile_completion = getattr(user.profile, 'completion_percentage', 0)
                profile_pic=getattr(user.profile, 'profile_picture', None)

            return Response({
                "message": "Login successful",
                "success": True,
                "tokens": tokens,
                "user": {
                    "username": username,
                    "email": email,
                    "role": role,
                    "profile_completed": profile_completion,
                    "profile_pic": profile_pic.url if profile_pic else None
                }
            }, status=status.HTTP_200_OK)

        else:
            return Response({
                "message": "Invalid email or password",
                "success": False
            }, status=status.HTTP_404_NOT_FOUND)
        

class GetUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
class UpdateUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):

        try:
            user_to_update = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"success": False, "message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Only admin or the user themselves can update
        if request.user != user_to_update and request.user.role != 'admin':
            return Response({"success": False, "message": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        serializer = UserSerializer(user_to_update, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "User Data updated successfully"
                
            }, status=status.HTTP_200_OK)

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class UpdateUserStatusAPIView(APIView):
    permission_classes=[IsAdminRole]
    def put(self,request,pk):

        status_type=request.data.get("status")

        if not status_type:
            return Response({"success": False, "message": "Invalid Action "}, status=status.HTTP_404_NOT_FOUND)
        
        result="new_user"
        if status_type and status_type == "suspended":
            result="inactive"

        if status_type and status_type =="active":
            result="active"
            
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"success": False, "message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        user.is_user_active=result
        user.save()
        return Response({
                "success": True,
                "message": "User Status Updated Successfully"
                
            }, status=status.HTTP_200_OK)



class ListUsersView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        role = request.GET.get("role")
        status_type = request.GET.get("status")
        search = request.GET.get("search")
        search_type = request.GET.get("search_type")

        users = User.objects.all()


        if role in ["vendor", "stockist", "reseller"]:
            users = users.filter(role=role)
        if status_type and status_type == "active":
            users = users.filter(is_user_active="active")

        if status_type and status_type =="suspended":
            users = users.filter(is_user_active="inactive")

        if search:
            if search_type == "email":
                users = users.filter(Q(email__icontains=search))
            elif search_type == "phone":
                users = users.filter(Q(profile__phone__icontains=search))
            else:
                # Generic search across common fields
                users = users.filter(
                    Q(email__icontains=search) |
                    Q(profile__phone__icontains=search)
                )

        serializer = UserListSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class DeleteUserAPIView(APIView):
    permission_classes = [ IsAdminRole]

    def delete(self, request,pk):
        user_id = pk

        if not user_id:
            return Response({"message": "User ID is required","success":False}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(User, id=user_id)

        if user == request.user:
            return Response({"message": "You cannot delete yourself","success":False}, status=status.HTTP_400_BAD_REQUEST)

        user.delete()
        return Response({"message": "User deleted successfully","success":True}, status=status.HTTP_204_NO_CONTENT)

class UserProfileView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.profile



class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response({"message": "Refresh token is required", "success": False}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()  # Blacklist the refresh token
            return Response({"message": "Logout successful", "success": True}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"message": str(e), "success": False}, status=status.HTTP_400_BAD_REQUEST)
        

class WalletView(generics.RetrieveAPIView):
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return Wallet.objects.get(user=self.request.user)


# Admin only - update user wallet balance (credit or debit)
class WalletUpdateView(generics.UpdateAPIView):
    serializer_class = WalletSerializer
    permission_classes = [IsAdminRole]
    lookup_field = 'user__email' 
    queryset = Wallet.objects.all()

    def update(self, request, *args, **kwargs):
        
        wallet = self.get_object()
        data = request.data
        transaction_type = data.get("transaction_type")
        amount = data.get("amount")
        description = data.get("description", "")
        status = data.get("transaction_status", "SUCCESS")

        if not amount or not transaction_type:
            return Response({"message": "Amount and transaction_type are required.", "status": False}, status=400)

        try:
            amount = Decimal(str(amount))  # Safely convert to Decimal
        except (InvalidOperation, ValueError):
            return Response({"message": "Invalid amount.", "status": False}, status=400)

        if transaction_type == "CREDIT":
            wallet.balance += amount
        elif transaction_type == "DEBIT":
            if wallet.balance < amount:
                return Response({"message": "Insufficient wallet balance.", "status": False}, status=400)
            wallet.balance -= amount
        else:
            return Response({"message": "Invalid transaction type.", "status": False}, status=400)

        wallet.save()

        WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type=transaction_type,
            amount=amount,
            transaction_status=status,
            description=description,
        )

        return Response(WalletSerializer(wallet).data)


class WalletTransactionListView(generics.ListAPIView):
    serializer_class = WalletTransactionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination  

    def get_queryset(self):
        queryset = WalletTransaction.objects.filter(wallet__user=self.request.user)
        
        # Get filter parameters from request
        transaction_type = self.request.query_params.get('type')
        status = self.request.query_params.get('status')
        start_date = self.request.query_params.get('fromDate')
        end_date = self.request.query_params.get('toDate')
        
        # Apply filters
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        if status:
            queryset = queryset.filter(transaction_status=status)
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=start_date)
            except ValueError:
                pass
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=end_date)
            except ValueError:
                pass
                
        return queryset.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data,
            'total_pages': self.paginator.page.paginator.num_pages if page else 1,
        })
    

class WalletSummaryView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get user's wallet
        try:
            wallet = Wallet.objects.get(user=user)
        except Wallet.DoesNotExist:
            return Response({'error': 'Wallet not found.'}, status=404)

        # ✅ Calculate total sales from Sale model
        total_sales = Sale.objects.filter(seller=user).aggregate(
            total=Sum('total_price')
        )['total'] or 0

        # ✅ Total withdrawals from WithdrawalRequest
        total_withdrawals = WithdrawalRequest.objects.filter(
            user=user,
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or 0

        # ✅ Prepare response
        data = {
            'current_balance': wallet.balance,
            'total_sales': total_sales,
            'total_withdrawals': total_withdrawals
        }

        return Response(data)

class ForgotPasswordView(APIView):
    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"http://localhost:3000/reset-password/{uid}/{token}"

            # Simulate email send
            print(f"Password reset link for {email}: {reset_link}")
            # Uncomment to send email
            # send_mail("Reset your password", f"Click here to reset your password: {reset_link}", "noreply@example.com", [email])

            return Response({"detail": "Password reset link sent. Check terminal for now."})
        except User.DoesNotExist:
            return Response({"detail": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)


class ResetPasswordView(APIView):
    def post(self, request):
      
        uidb64 = request.data.get("userid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not uidb64 or not token or not new_password:
            return Response({"detail": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)

            if default_token_generator.check_token(user, token):
                user.set_password(new_password)
                user.save()
                return Response({"detail": "Password reset successfully."})
            else:
                return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"detail": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response({"detail": "Both old and new passwords are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({"detail": "Old password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"detail": "Password changed successfully."})
    

class StateListView(generics.ListAPIView):
    queryset = State.objects.all()
    serializer_class = StateSerializer
    permission_classes = [IsAuthenticated] 
    pagination_class = None 

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DistrictListView(generics.ListAPIView):
    serializer_class = DistrictSerializer
    permission_classes = [IsAuthenticated]  
    pagination_class = None

    def get_queryset(self):
        state_id = self.kwargs.get('state_id')
        return District.objects.filter(state_id=state_id)

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except District.DoesNotExist:
            return Response({"error": "Districts not found for the given state."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class StockistsByStateAPIView(APIView):
    """
    Fetch stockists by state.
    """
    def get(self, request, state_id):
        stockists = User.objects.filter(role='stockist', addresses__state_id=state_id).distinct()
        if not stockists.exists():
            return Response({"error": "No stockists found for this state."}, status=status.HTTP_404_NOT_FOUND)
        serializer = StockistSerializer(stockists, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    


def clean_null_strings(data):
    cleaned = {}
    for key, value in data.items():
        if value == "null":
            cleaned[key] = None
        else:
            cleaned[key] = value
    return cleaned

class ProfileView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user= User.objects.get(id=request.user.id)
        if request.user.role == "vendor": 
            serializer = UserListSerializer(user,many=False)
        else:
            serializer = ProfileSerializer(user.profile, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        try:
            user = request.user
            data = clean_null_strings(request.data.copy())
            files = request.FILES
            response_data = {}

            def handle_file_fields(data_dict, file_fields):
                for field in file_fields:
                    if field in files:
                        data_dict[field] = files[field]
                    else:
                        data_dict.pop(field, None)
                return data_dict

            # --- Profile Update ---
            if 'profile' in request.data:
                profile = Profile.objects.get(user=user)
                data_profile = data.copy()
                data_profile.pop('profile', None)
                file_fields = ['pancard_pic', 'profile_picture', 'adhaar_card_pic']
                data_profile = handle_file_fields(data_profile, file_fields)

                serializer = ProfileCreateSerializer(
                    profile, data=data_profile, context={'request': request}, partial=True
                )
                if serializer.is_valid():
                    serializer.save()
                    response_data['profile'] = serializer.data
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # --- Address Update ---
            if 'address' in request.data:
                address = getattr(user, 'address', None) or Address.objects.create(user=user)
                data_address = data.copy()
                for field in ['user', 'address']:
                    data_address.pop(field, None)

                serializer = AddressCreateSerializer(address, data=data_address, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    response_data['address'] = serializer.data
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # --- Business/Company Update ---
            if 'business' in request.data:
                company = getattr(user, 'company', None)
                if not company:
                    return Response(
                        {"message": "Your Company Details Not Exist"},
                        status=status.HTTP_404_NOT_FOUND
                    )

                data_business = data.copy()
                for field in ['created_at', 'updated_at', 'user', 'business']:
                    data_business.pop(field, None)

                file_fields = ['gst_certificate', 'pan_card', 'business_registration_doc', 'food_license_doc']
                data_business = handle_file_fields(data_business, file_fields)

                serializer = CompanyCreateSerializer(company, data=data_business, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    response_data['business'] = serializer.data
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # --- Payment Update ---
            if 'payment' in request.data:
                profile = Profile.objects.get(user=user)
                if 'passbook_pic' in files:
                    profile.passbook_pic = files['passbook_pic']

                for field in ['account_number', 'bank_name', 'ifsc_code', 'account_holder_name', 'upi_id']:
                    setattr(profile, field, data.get(field))
                profile.save()
                response_data['payment'] = "Payment Details Updated Successfully"

            return Response(response_data, status=status.HTTP_200_OK)

        except Profile.DoesNotExist:
            return Response(
                {"detail": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




class AssignedResellersView(APIView):
    permission_classes = [IsStockistRole]

    def get(self, request):
        # Get reseller IDs assigned to this stockist
        assigned_reseller_ids = StockistAssignment.objects.filter(
            stockist=request.user
        ).values_list('reseller_id', flat=True)

        # Fetch corresponding address records
        addresses = Address.objects.filter(user__id__in=assigned_reseller_ids)
        serializer = AddressWithUserAndProfileSerializer(addresses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class BroadcastMessageListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(request.user, 'role', None)
        if role == 'stockist':
            messages = BroadcastMessage.objects.filter(
                is_active=True
            ).filter(Q(visible_to="stockist") | Q(visible_to="all"))
        
        elif role == 'reseller':
            messages = BroadcastMessage.objects.filter(
                is_active=True
            ).filter(Q(visible_to="reseller") | Q(visible_to="all"))
        
        elif role == 'vendor':
            messages = BroadcastMessage.objects.filter(
                is_active=True
            ).filter(Q(visible_to="vendor") | Q(visible_to="all"))

        else:  
            messages = BroadcastMessage.objects.all()

        messages = messages.order_by('-created_at')
        serializer = BroadcastMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.role == 'admin':
            return Response({"message": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        serializer = BroadcastMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(admin=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BroadcastMessageDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if not request.user.role == 'admin':
            return Response({"message": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        try:
            message = BroadcastMessage.objects.get(pk=pk)
        except BroadcastMessage.DoesNotExist:
            return Response({"message": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        message.delete()
        return Response({"message": "Announcement deleted."}, status=status.HTTP_204_NO_CONTENT)

    def put(self, request, pk):
        if not request.user.role == 'admin':
            return Response({"message": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        try:
            message = BroadcastMessage.objects.get(pk=pk)
        except BroadcastMessage.DoesNotExist:
            return Response({"message": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = BroadcastMessageSerializer(message, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class TopUpRequestListCreateView(generics.ListCreateAPIView):
    """
    Admin: Lists pending top-ups.
    Non-admin: Lists own top-ups.
    """
    serializer_class = TopupRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return TopupRequest.objects.filter(status="pending").order_by('-created_at')
        return TopupRequest.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TopUpRequestUpdateView(generics.UpdateAPIView):
    """
    Admin-only: Updates top-up request status.
    """
    queryset = TopupRequest.objects.all()
    serializer_class = TopupRequestSerializer
    permission_classes = [IsAdminRole]

    def update(self, request, *args, **kwargs):
        topup = self.get_object()
        status_action = request.data.get("status")
        reason = request.data.get("rejected_reason", "")

        if status_action not in ["approved", "rejected", "completed", "pending"]:
            return Response(
                {"message": "Invalid status action.", "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        topup.status = status_action
        topup.updated_at = datetime.now()

        # Optional: You can track who approved it by adding `approved_by = models.ForeignKey(...)`
        if status_action == "rejected" and reason:
            topup.note = f"{topup.note or ''}\n[REJECTION REASON] {reason}"

        topup.save()
        return Response({"message": "Top-up status updated successfully."}, status=status.HTTP_200_OK)
    

class WithdrawlRequestListCreateView(generics.ListCreateAPIView):
    """
    Admin: Lists pending top-ups.
    Non-admin: Lists own top-ups.
    """
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return WithdrawalRequest.objects.filter(status="pending").order_by('-created_at')
        return WithdrawalRequest.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WithdrawlRequestUpdateView(generics.UpdateAPIView):
    """
    Admin-only: Updates top-up request status.
    """
    queryset = WithdrawalRequest.objects.all()
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [IsAdminRole]

    def update(self, request, *args, **kwargs):
        topup = self.get_object()
        status_action = request.data.get("status")
        reason = request.data.get("rejected_reason", "")

        if status_action not in ["approved", "rejected", "completed", "pending"]:
            return Response(
                {"message": "Invalid status action.", "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        topup.status = status_action
        topup.updated_at = datetime.now()

        # Optional: You can track who approved it by adding `approved_by = models.ForeignKey(...)`
        if status_action == "rejected" and reason:
            topup.note = f"{topup.note or ''}\n[REJECTION REASON] {reason}"

        topup.save()
        return Response({"message": "Top-up status updated successfully."}, status=status.HTTP_200_OK)
    

class UserPaymentDetailsView(generics.RetrieveUpdateAPIView):
    serializer_class = UserPaymentDetailsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile

    # def put(self, request, *args, **kwargs):
    #     instance = self.get_object()
    #     serializer = self.get_serializer(instance, data=request.data, partial=True)

    #     if serializer.is_valid():
    #         serializer.save()
    #         return Response({
    #             "message": "Payment details updated successfully.",
    #             "data": serializer.data
    #         })
    #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        days = int(request.query_params.get('days', 0))

        # Determine the date range
        if days == 0:
            now = datetime.now()
            date_from = make_aware(datetime.combine(now.date(), datetime.min.time()))
        else:
            date_from = make_aware(datetime.now() - timedelta(days=days))

        # Fetch wallet
        wallet = Wallet.objects.filter(user=user).first()
        wallet_data = {
            'balance': wallet.balance if wallet else 0,
            'total_sales': self.get_total_sales(user, date_from),
            'total_withdrawals': self.get_total_withdrawals(user,date_from),
        }

        # Product stats
        product_qs = Product.objects.filter(owner=user)
        product_stats = {
            'total': product_qs.count(),
            'published': product_qs.filter(status='published').count(),
            'draft': product_qs.filter(status='draft').count(),
            'inactive': product_qs.filter(is_featured=False).count(),
            'active': product_qs.filter(is_featured=True).count(),
        }

        return Response({
            'wallet': wallet_data,
            'products': product_stats,
            'orders': 0,  # You can implement this if needed
            'topups': list(self.get_topups(user, date_from)),
            'withdrawal_requests': list(self.get_withdrawals(user, date_from)),
        })

    def get_total_sales(self, user, date_from):
        return Sale.objects.filter(
            seller=user,
            sale_date__gte=date_from.date()  # Only use date since sale_date is a DateField
        ).aggregate(total=Sum('total_price'))['total'] or 0

    def get_total_withdrawals(self, user,date_from):
        return WithdrawalRequest.objects.filter(
            user=user,
            status='approved',
            created_at__gte=date_from  
        ).aggregate(total=Sum('amount'))['total'] or 0



    def get_topups(self, user, date_from):
        return TopupRequest.objects.filter(
            user=user,
            created_at__gte=date_from
        ).values('id', 'amount', 'status', 'payment_method', 'created_at')

    def get_withdrawals(self, user, date_from):
        return WithdrawalRequest.objects.filter(
            user=user,
            created_at__gte=date_from
        ).values('id', 'amount', 'status', 'payment_method', 'created_at')
    

class TodayNotificationListAPIView(APIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = datetime.now().date()
        notifications = Notification.objects.filter(
            user=request.user,
            created_at__date=today
        )[:10]  

        serializer = self.serializer_class(notifications, many=True)
        return Response(serializer.data)


# new user application 

class NewAccountApplicationCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = NewAccountApplicationSerializer(data=request.data)
        
        if not serializer.is_valid():
            errors = serializer.errors
            # Check for prioritized field errors
            for field in ['email', 'phone']:
                if field in errors:
                    return Response({
                        'message': errors[field][0],
                        'status': False
                    }, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                'message': 'Invalid data',
                'errors': errors,
                'status': False
            }, status=status.HTTP_400_BAD_REQUEST)

        # Save application and notify admin
        serializer.save()
        admin_user = User.objects.filter(role="admin").first()
        if admin_user:
            create_notification(
                user=admin_user,
                title="New Account Application",
                message=f"New account application received from {serializer.validated_data['full_name']} ({serializer.validated_data['email']})",
                notification_type='New Application',
                related_url=''
            )

        return Response({
            'message': 'Application submitted successfully',
            'status': True
        }, status=status.HTTP_201_CREATED)


class NewAccountApplicationListView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        status_filter = request.query_params.get('status')
        search = request.query_params.get('search')
        search_type = request.query_params.get('search_type')
        role_type = request.query_params.get('role')

        applications = NewAccountApplication.objects.all().order_by('-created_at')

        if status_filter:
            applications = applications.filter(status=status_filter,role=role_type)

        if search and search_type:
            if search_type == "email":
                applications = applications.filter(email__icontains=search)
            elif search_type == "name":
                applications = applications.filter(name__icontains=search)
            elif search_type == "phone":
                applications = applications.filter(phone__icontains=search)
            # Add more `search_type` options here as needed

        if status_filter == "pending":
            serializer = ApplicationWithUserSerializer(applications, many=True)
        else:
            serializer = NewAccountApplicationSerializer(applications, many=True)
        return Response(serializer.data)

class ApproveApplicationView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        application = get_object_or_404(NewAccountApplication, pk=pk)

        # Update application status
        application.status = 'pending'
        application.save()

        default_passwords = {
            "stockist": "KutomS@123",
            "vendor": "KutomV@123",
            "reseller": "KutomR@123"
        }
        default_password = default_passwords.get(application.role, "Kutom@123")

        try:
            # User already exists
            user = User.objects.get(email=application.email)
            user.is_active = True
            user.is_user_active = "new_user"
            user.save()
            return Response({'message': 'Application  Status Updated.'}, status=200)

        except User.DoesNotExist:
            # Create new user
            user = User.objects.create_user(
                username=application.full_name,
                email=application.email,
                password=default_password,
                role=application.role,
                is_active=True,
                is_user_active="new_user"
            )

            # Set profile info only for new users
            if hasattr(user, 'profile'):
                user.profile.full_name = application.full_name
                user.profile.phone = application.phone
                user.profile.save()

            return Response({'message': 'Application approved and user account created.'}, status=200)
        except Exception as e:
            return Response({'message': str(e)}, status=400)

class RejectApplicationView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        application = get_object_or_404(NewAccountApplication, pk=pk)

        application.status = 'rejected'
        application.rejected_reason = request.data.get('reason', 'No reason provided')

        application.save()

        return Response({'message': 'Application rejected.'}, status=200)
    

class UpdateApprovalStatusView(APIView):
    permission_classes = [IsAdminRole]

    def put(self, request, user_id):
        approval = get_object_or_404(ProfileApprovalStatus, user__id=user_id)
        serializer = ProfileApprovalStatusUpdateSerializer(
            approval, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()

        
            create_notification(
                user=approval.user,
                title="Profile Approval Status Updated",
                message=f"Your profile has been reviewed by Admin.",
                notification_type='Profile Approval',
                related_url=''
            )

            return Response({
                'message': 'Approval status updated successfully',
                'completion': approval.calculate_completion()
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class GetProfileApprovalStatusView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, user_id):

        approval = get_object_or_404(ProfileApprovalStatus, user__id=user_id)
        serializer = ProfileApprovalStatusUpdateSerializer(approval)
        return Response(serializer.data, status=status.HTTP_200_OK)

class VerifyUserKYCView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, user_id):
        try:
            profile = Profile.objects.select_related("user").get(user__id=user_id)
        except Profile.DoesNotExist:
            return Response({"message": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)

        if profile.kyc_verified:
            return Response({"message": "KYC is already verified."}, status=status.HTTP_400_BAD_REQUEST)

        # Update profile and user
        profile.kyc_verified = True
        profile.kyc_status = "APPROVED"
        profile.kyc_verified_at = datetime.now()
        profile.user.is_user_active = "active"

        # Save both in one go
        profile.save()
        profile.user.save(update_fields=["is_user_active"])

        # Update matching account application
        NewAccountApplication.objects.filter(
            email=profile.user.email,
            status='pending'
        ).update(status='approved')

        # Send notification
        create_notification(
            user=profile.user,
            title="KYC Verification",
            message="Your KYC has been successfully verified.",
            notification_type='KYC',
            related_url=''
        )

        return Response({"message": "KYC verified successfully."}, status=status.HTTP_200_OK)

    
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)