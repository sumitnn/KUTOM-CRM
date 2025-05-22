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
from .permissions import IsAdminRole, IsVendorRole, IsStockistRole
from rest_framework import generics
from django.shortcuts import get_object_or_404
from decimal import Decimal, InvalidOperation
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str


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
            return Response({"message": "Email and password are required","success":False}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, email=email, password=password)
        if user is not None:
            tokens = get_tokens_for_user(user)
            role = getattr(user, 'role', None)  
            username = getattr(user, 'username', None)  
            email = getattr(user, 'email', None)  

            return Response({
                "message": "Login successful",
                "success": True,
                "tokens": tokens,
                "user": {
                    "username": username,
                    "email": email,
                    "role": role
                }
                
            }, status=status.HTTP_200_OK)
            
        else:
            return Response({"message": "Invalid email or password","success":False}, status=status.HTTP_401_UNAUTHORIZED)
        

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

class ListUsersView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):

        if request.GET.get("role")=="vendor":
            users = User.objects.filter(role="vendor")
        elif request.GET.get("role")=="stockist":
            users = User.objects.filter(role="stockist")
        else:
            users = User.objects.all()
        serializer = UserSerializer(users, many=True)
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
    lookup_field = 'user__id' 
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

# All users see their own transactions; Admins can see all
class WalletTransactionListView(generics.ListAPIView):
    serializer_class = WalletTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # if self.request.user.is_staff:
        #     return WalletTransaction.objects.select_related('wallet__user').all()
        return WalletTransaction.objects.filter(wallet__user=self.request.user)
    


class ForgotPasswordView(APIView):
    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"http://localhost:8008/reset-password/{uid}/{token}"

            # Simulate email send
            print(f"Password reset link for {email}: {reset_link}")
            # Uncomment to send email
            # send_mail("Reset your password", f"Click here to reset your password: {reset_link}", "noreply@example.com", [email])

            return Response({"detail": "Password reset link sent. Check terminal for now."})
        except User.DoesNotExist:
            return Response({"detail": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)


class ResetPasswordView(APIView):
    def post(self, request):
        uidb64 = request.data.get("uid")
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

    def post(self, request):
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
    


class TopUpRequestListCreateView(generics.ListCreateAPIView):
    queryset = TopUpRequest.objects.all()
    serializer_class = TopUpRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return TopUpRequest.objects.all()
        return TopUpRequest.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TopUpRequestReviewView(generics.UpdateAPIView):
    queryset = TopUpRequest.objects.all()
    serializer_class = TopUpRequestSerializer
    permission_classes = [IsAdminRole]

    def update(self, request, *args, **kwargs):
        topup = self.get_object()
        status_action = request.data.get("status")
        reason = request.data.get("rejected_reason", "")

        if status_action not in ["APPROVED", "REJECTED", "INVALID_SCREENSHOT", "INVALID_AMOUNT"]:
            return Response({"detail": "Invalid status action."}, status=status.HTTP_400_BAD_REQUEST)

        topup.status = status_action
        topup.reviewed_at = now()
        topup.approved_by = request.user
        if status_action in ["REJECTED", "INVALID_SCREENSHOT", "INVALID_AMOUNT"]:
            topup.rejected_reason = reason
        topup.save()

        return Response(TopUpRequestSerializer(topup).data)