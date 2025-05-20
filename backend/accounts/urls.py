
from django.urls import path,include
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView
urlpatterns = [

    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('user/', GetUserView.as_view(), name='get-user'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('delete-user/', DeleteUserView.as_view(), name='delete-user'),
    path('users-list/', ListUsersView.as_view(), name='users-list'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh')
]
