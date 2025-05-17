from django.urls import path
from .views import create_user, edit_user, delete_user

urlpatterns = [
    path('create-user/', create_user, name='create-user'),
    path('edit-user/<int:user_id>/', edit_user, name='edit-user'),
    path('delete-user/<int:user_id>/', delete_user, name='delete-user'),
]