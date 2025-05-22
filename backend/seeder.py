import os
import django
import random
from faker import Faker
from decimal import Decimal
import uuid
from django.utils import timezone
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from accounts.models import User, Profile,WalletTransaction, TopUpRequest ,Wallet
from orders.models import Order, OrderItem
from products.models import Brand, Category, Product

fake = Faker()

def create_users(num=10):
    roles = ['admin', 'reseller', 'stockist',"vendor"]
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
        profile.save()
        users.append(user)
    return users

def create_brands(num=5):
    return [Brand.objects.create(
        name=fake.unique.company(),
        description=fake.text(max_nb_chars=200)
    ) for _ in range(num)]

def create_categories(num=5):
    return [Category.objects.create(
        name=fake.unique.word().capitalize(),
        description=fake.sentence()
    ) for _ in range(num)]

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
            OrderItem.objects.create(order=order, product=product, quantity=quantity, price=price)
        order.total_price = total
        order.save()

def create_wallets_and_transactions(users):
 
    for user in users:
        wallet = user.wallet

        for _ in range(random.randint(1, 5)):
            amount = Decimal(random.randint(10, 1000))
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type=random.choice(['CREDIT', 'DEBIT']),
                amount=amount,
                description=fake.sentence(),
                transaction_status=random.choice(['SUCCESS', 'FAILED', 'PENDING', 'RECEIVED', 'REFUND'])
            )

def create_topup_requests(users):
    for user in users:
        for _ in range(random.randint(0, 2)):
            reviewed_at = (
                timezone.make_aware(fake.date_time_this_year())
                if random.random() > 0.5
                else None
            )
            TopUpRequest.objects.create(
                user=user,
                amount=Decimal(random.randint(100, 2000)),
                status=random.choice(['PENDING', 'APPROVED', 'REJECTED', 'INVALID_SCREENSHOT', 'INVALID_AMOUNT']),
                note=fake.sentence(),
                rejected_reason=random.choice([fake.sentence(), None, ""]),
                reviewed_at=reviewed_at,
                approved_by=random.choice(users) if random.random() > 0.5 else None
            )

# === RUN SEEDING ===
print("🌱 Seeding data...")

users = create_users(30)
print("user creation done")
brands = create_brands(15)
print("brand creation done")
categories = create_categories(5)
print("category creation done")
products = create_products(brands, categories, 20)
print("product creation done")
resellers = [u for u in users if u.role == 'reseller']
stockists = [u for u in users if u.role == 'stockist']

create_orders(resellers, stockists, products, 10)
print("create orders done")
create_wallets_and_transactions(users)
print("wallet transactions done")
create_topup_requests(users)
print("topup request done")
print("✅ Done seeding.")
