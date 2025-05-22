import os
import django
import random
from faker import Faker
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")  
django.setup()

from accounts.models import User, Profile
from orders.models import Order, OrderItem
from products.models import Brand, Category, Product

fake = Faker()

def create_users(num=10):
    roles = ['admin', 'reseller', 'stockist',]
    users = []
    for _ in range(num):
        email = fake.unique.email()
        role = random.choice(roles)
        user = User.objects.create_user(
            email=email,
            password="password@123",
            username=fake.user_name(),
            role=role
        )
        profile = user.profile
        profile.full_name = fake.name()
        profile.date_of_birth = fake.date_of_birth(minimum_age=18, maximum_age=60)
        profile.phone = fake.phone_number()
        profile.address = fake.address()
        profile.city = fake.city()
        profile.state = fake.state()
        profile.pincode = fake.postcode()
        profile.save()
        users.append(user)
    return users

def create_brands(num=5):
    brands = []
    for _ in range(num):
        brand = Brand.objects.create(
            name=fake.unique.company(),
            description=fake.text(max_nb_chars=200)
        )
        brands.append(brand)
    return brands

def create_categories(num=5):
    categories = []
    for _ in range(num):
        category = Category.objects.create(
            name=fake.unique.word().capitalize(),
            description=fake.sentence()
        )
        categories.append(category)
    return categories

def create_products(brands, categories, num=20):
    products = []
    for _ in range(num):
        product = Product.objects.create(
            name=fake.unique.word().capitalize(),
            brand=random.choice(brands),
            category=random.choice(categories),
            description=fake.text(),
            price=Decimal(random.randint(100, 1000)),
            cost_price=Decimal(random.randint(50, 100)),
            stock=random.randint(10, 100),
            status=random.choice(['active', 'inactive'])
        )
        products.append(product)
    return products

def create_orders(resellers, stockists, products, num=15):

    for _ in range(num):
        reseller = random.choice(resellers)
        stockist = random.choice(stockists) if stockists else None
        order = Order.objects.create(
            reseller=reseller,
            stockist=stockist,
            status=random.choice(['pending', 'forwarded', 'approved', 'rejected']),
            description=fake.text(),
            total_price=0
        )

        total = 0
        for _ in range(random.randint(1, 5)):
            product = random.choice(products)
            quantity = random.randint(1, 5)
            price = product.price
            total += quantity * price
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=price
            )
        order.total_price = total
        order.save()

# ==== RUN SEEDING ====
print("Seeding data...")

users = create_users(20)
brands = create_brands(15)
categories = create_categories(5)
products = create_products(brands, categories, 20)

# users=User.objects.exclude(role='superuser')
# products=Product.objects.all()

resellers = [u for u in users if u.role == 'reseller']
stockists = [u for u in users if u.role == 'stockist']

create_orders(resellers, stockists, products, 10)

print("✅ Done seeding.")
