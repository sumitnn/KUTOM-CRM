
from django.urls import path,include
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView
urlpatterns = [

    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('user/', GetUserView.as_view(), name='get-user'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('users-list/', ListUsersView.as_view(), name='users-list'),
    path('assigned-resellers/', AssignedResellersView.as_view(), name='assigned-resellers'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('update-user/<uuid:pk>/', UpdateUserAPIView.as_view(), name='update-user'),
    path('update-user-status/<uuid:pk>/', UpdateUserStatusAPIView.as_view(), name='update-user-status'),
    path('delete-user/<uuid:pk>/', DeleteUserAPIView.as_view(), name='delete-user'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('payment-details/', UserPaymentDetailsView.as_view(), name='user-payment-details'),
    path('admin-payment-details/', ADMINPaymentDetailsView.as_view(), name='admin-payment-details'),

    # fetch stockist by state
    path('stockists/<int:state_id>/', StockistsByStateAPIView.as_view(), name='get_stockists_by_state'),

    # password related
     path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),

    # wallet apis 
    path('wallet/', WalletView.as_view(), name='wallet'),         
    path('wallet-summary/', WalletSummaryView.as_view(), name='wallet-summary'),         
    path('wallet/update/<str:user__email>/', WalletUpdateView.as_view(), name='wallet-update'), 
    path('wallet/transactions/', WalletTransactionListView.as_view(), name='wallet-transactions'),

    # topup request 
    path('topup-request/update/<int:pk>/', TopUpRequestUpdateView.as_view(), name='topup-update'),
    path('topup-request/', TopUpRequestListCreateView.as_view(), name='topup-request'),

    # withdrawal request
    
    path('withdrawl-request/', WithdrawalRequestListCreateView.as_view(), name='withdrawl-request'),

    # State and District related APIs
    path('states/', StateListView.as_view(), name='state-list'),
    path('states/<int:state_id>/districts/', DistrictListView.as_view(), name='district-list'),

    # broadcast apis  
    path('announcements/', BroadcastMessageListCreateAPIView.as_view(), name='announcement-list-create'),
    path('announcements/<int:pk>/', BroadcastMessageDetailAPIView.as_view(), name='announcement-detail'),

    # notification
    path('notifications/today/', TodayNotificationListAPIView.as_view(), name='today-notifications'),

    # DashboardAPI
    path('dashboard-summary/', DashboardAPIView.as_view(), name='dashboard-summary'),
    path('admin-dashboard-summary/', ADMINDashboardAPIView.as_view(), name='admin-dashboard-summary'),

    # user application Apis 
    path('apply/', NewUserCreationView.as_view(), name='apply'),
    path('applications/', NewUserApplicationListView.as_view(), name='list-applications'),
    path('applications/<uuid:pk>/approve/', ApproveApplicationView.as_view(), name='approve-application'),
    path('applications/<uuid:pk>/reject/', RejectNewUserApplicationView.as_view(), name='reject-application'),
    path('update-profile-status/<uuid:user_id>/', UpdateApprovalStatusView.as_view(), name='update-profile-approval-status'),
    path('get-profile-status/<uuid:user_id>/', GetProfileApprovalStatusView.as_view(), name='get-profile-approval-status'),

    # kyc verified 
    path('admin/user-kyc-verify/<uuid:user_id>/', VerifyUserKYCView.as_view(), name='user-verify-kyc'),
    path('admin/withdrawals/', AdminWithdrawalRequestListAPIView.as_view(), name='admin-withdrawal-list'),
    path('admin/withdrawals/<int:pk>/', AdminWithdrawalRequestDetailAPIView.as_view(), name='admin-withdrawal-detail'),

    # me 
      path('me/', CurrentUserView.as_view(), name='current-user'),
    # default stockist a
    path('mark-default-stockist/<uuid:user_id>/', MarkDefaultStockistView.as_view(), name='mark_default_stockist'),
    path('not-default-stockist/', StockistListExcludingDefaultView.as_view(), name='not-default-stockist'),

    path('stockist-assignments/', StockistAssignmentView.as_view(), name='stockist-assignments'),
    path('stockist-assignments/<uuid:reseller_id>/', StockistAssignmentView.as_view(), name='stockist-assignment-detail'),

    # contact us 
     path('contact/send-message/', send_contact_message, name='send_contact_message'),


]
