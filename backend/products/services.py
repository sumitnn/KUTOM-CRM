from django.utils import timezone
from .models import StockInventory, ExpiryTracker, StockInventoryHistory, User
from datetime import timedelta

def process_expiring_stock_for_admin_vendor(days_threshold=30):
    today = timezone.now().date()
    cutoff_date = today + timedelta(days=days_threshold)
    # Filter expiry_date between today and cutoff_date
    expiring_items = StockInventory.objects.filter(
        expiry_date__range=[today, cutoff_date],
        total_quantity__gt=0,
        is_expired=False,
        user__role__in=['admin', 'vendor']
    )

    for stock in expiring_items:
        quantity_to_deduct = stock.total_quantity

        if stock.user.role == 'vendor' or stock.user.role == 'admin':
            ExpiryTracker.objects.update_or_create(
                stock_item=stock,
                user=stock.user,
                batch_number=stock.batch_number,
                defaults={
                    'expiry_date': stock.expiry_date,
                    'remaining_days': (stock.expiry_date - today).days,
                    'status': 'expiring',
                    'stock_quantity': quantity_to_deduct,
                    'can_request_return': True if stock.user.role == 'admin' else False
                }
            )
            

