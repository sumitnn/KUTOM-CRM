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
from .models import User
from .permissions import IsAdminRole, IsVendorRole, IsStockistRole
from rest_framework import generics

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()

            return Response({
                "message": "User registered successfully",
                "success":True,
                "user": {
                    "email": serializer.data.get("email"),
                    "role": serializer.data.get("role"),
                    "username": serializer.data.get("username")
                }
 
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

    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)  
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User updated successfully", "user": serializer.data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
    
class DeleteUserView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({"detail": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

class UserProfileView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token is None:
                return Response({"message": "Refresh token is required", "success": False}, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()  # blacklist the refresh token

            return Response({"message": "Logout successful", "success": True}, status=status.HTTP_200_OK)
        
        except TokenError as e:
            return Response({"message": "Invalid or expired token", "success": False}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"message": str(e), "success": False}, status=status.HTTP_400_BAD_REQUEST)

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