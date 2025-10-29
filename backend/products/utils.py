

from django.utils import timezone
from .models import *
from django.db import transaction
from accounts.models import Notification

def expire_stock_deduct(product_id, variant_id=None, batch_id=None, user_id=None, status=None,quantity=None):
    today = timezone.now().date()


    filters = {
        'total_quantity__gt': 0,
    }
    if product_id:
        filters['product_id'] = product_id
    if variant_id:
        filters['variant_id'] = variant_id
    if user_id:
        filters['user_id'] = user_id
    if batch_id:
        filters['batch_number'] = batch_id

    stock_qs = StockInventory.objects.filter(**filters)

    if not stock_qs.exists():
        return False

    with transaction.atomic():
        for stock in stock_qs.select_related('user'):
            if stock.total_quantity <= 0:
                return False

            old_qty = stock.total_quantity
            quantity_to_deduct = quantity

            # Update stock
            stock.total_quantity = 0
            stock.is_expired = True
            stock.save(update_fields=['total_quantity', 'updated_at', 'is_expired'])
            stock.adjust_stock(
                    change_quantity=-quantity,           # deduct
                    action="REPLACEMENT",
                    reference_id=f"",
                )

           
            if status == 'expired':
                # Update expiry tracker
                ExpiryTracker.objects.update_or_create(
                    stock_item=stock,
                    user=stock.user,
                    defaults={
                        'expiry_date': stock.expiry_date,
                        'remaining_days': (stock.expiry_date - today).days if stock.expiry_date else 0,
                        'status': 'expired',
                        'stock_quantity': quantity_to_deduct,
                        'can_request_return': stock.user.role == 'admin',
                    }
                )

             

    return True


def restore_expired_stock(product_id, variant_id=None, batch_id=None, quantity=None):
    today = timezone.now().date()
   

    filters = {
        'product_id': product_id,
        'is_expired': True,  
    }
    if variant_id:
        filters['variant_id'] = variant_id
    
    if batch_id:
        filters['batch_number'] = batch_id

    expired_stocks = StockInventory.objects.filter(**filters)

    if not expired_stocks.exists():
        return False

    with transaction.atomic():
        for stock in expired_stocks.select_related('user'):
            # Fetch related expiry tracker
            try:
                expiry_tracker = ExpiryTracker.objects.get(stock_item=stock, user=stock.user)
            except ExpiryTracker.DoesNotExist:
                expiry_tracker = None

            # Determine quantity to restore
            quantity_to_add = expiry_tracker.stock_quantity if expiry_tracker else 0
            if quantity_to_add <= 0:
                continue

            old_qty = stock.total_quantity

            # Restore stock
            stock.total_quantity += quantity_to_add
            stock.is_expired = False
            stock.save(update_fields=['total_quantity', 'updated_at', 'is_expired'])

            # Update expiry tracker
            if expiry_tracker:
                expiry_tracker.status = 'approved'
                expiry_tracker.can_request_return = False
                expiry_tracker.save(update_fields=['status', 'can_request_return'])

            # Record stock history
            StockInventoryHistory.objects.create(
                stock_inventory=stock,
                user=stock.user,
                old_quantity=old_qty,
                change_quantity=quantity_to_add,
                new_quantity=stock.total_quantity,
                action='RESTORED',
                reference_id=None
            )

            # Send user notification
            Notification.objects.create(
                user=stock.user,
                title='Stock Restored or Exchaged Successfully',
                message=f'{quantity_to_add} units of {stock.product.name} have been restored to your inventory.',
                notification_type='stock_update',
            )

    return True