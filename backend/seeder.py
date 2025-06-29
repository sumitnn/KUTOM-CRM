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
    # users = [
    #     User.objects.create(
    #         email="admin@example.com",
    #         username="admin",
    #         role="admin",
    #         is_staff=True,
    #         is_active=True,
    #         password=make_password("password123")
    #     ),
    #     User.objects.create(
    #         email="vendor@example.com",
    #         username="vendor",
    #         role="vendor",
    #         is_active=True,
    #         password=make_password("password123")
    #     ),
    #     User.objects.create(
    #         email="reseller@example.com",
    #         username="reseller",
    #         role="reseller",
    #         is_active=True,
    #         password=make_password("password123")
    #     ),
    #     User.objects.create(
    #         email="stockist@example.com",
    #         username="stockist",
    #         role="stockist",
    #         is_active=True,
    #         password=make_password("password123")
    #     )
    # ]
    # print("✅ Created 4 users (admin, vendor, reseller, stockist)")

    # Create 4 brands
    brands = [
        Brand.objects.create(
            name="Nike",
            is_active=True
        ),
        Brand.objects.create(
            name="Adidas",
            is_active=True
        ),
        Brand.objects.create(
            name="Puma",
            is_active=True
        ),
        Brand.objects.create(
            name="Reebok",
            is_active=True
        )
    ]
    print("✅ Created 4 brands")


    print("🎉 Initial data seeding complete!")

if __name__ == "__main__":
    create_initial_data()