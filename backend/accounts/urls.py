
from django.urls import path,include
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView
urlpatterns = [

    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('user/', GetUserView.as_view(), name='get-user'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('users-list/', ListUsersView.as_view(), name='users-list'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('update-user/<uuid:pk>/', UpdateUserAPIView.as_view(), name='update-user'),
    path('delete-user/<uuid:pk>/', DeleteUserAPIView.as_view(), name='delete-user'),

    # password related
     path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),

    # wallet apis 
    path('wallet/', WalletView.as_view(), name='wallet'),         
    path('wallet/update/<str:user__email>/', WalletUpdateView.as_view(), name='wallet-update'), 
    path('wallet/transactions/', WalletTransactionListView.as_view(), name='wallet-transactions'),

    # topup request 
    path('topup-request/update/<int:pk>/', TopUpRequestUpdateView.as_view(), name='topup-update'),
    path('topup-request/', TopUpRequestListCreateView.as_view(), name='topup-reqeust'),

    # State and District related APIs
    path('states/', StateListView.as_view(), name='state-list'),
    path('states/<int:state_id>/districts/', DistrictListView.as_view(), name='district-list'),

]
