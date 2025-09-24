import os
import django
from django.utils import timezone
from django.contrib.auth.hashers import make_password

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from accounts.models import User
from products.models import Brand, Category, SubCategory

def create_initial_data():
    # Create 4 users with different roles

    User.objects.create(
            email="admin@example.com",
            username="admin",
            role="admin",
            is_staff=True,
            is_active=True,
            password=make_password("password123"))
    

if __name__ == "__main__":
    create_initial_data()