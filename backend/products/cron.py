from datetime import timedelta
from django.utils import timezone
from .models import StockInventory, ExpiryTracker
from orders.models import OrderRequest
from accounts.models import User
from django.db import transaction
from accounts.utils import send_html_email

def process_expiring_stock_for_admin_vendor(days_threshold=30):
    today = timezone.now().date()
    cutoff_date = today + timedelta(days=days_threshold)

    expiring_items = StockInventory.objects.filter(
        expiry_date__range=[today, cutoff_date],
        total_quantity__gt=0,
        is_expired=False,
        user__role__in=['admin', 'vendor']
    )

    for stock in expiring_items:
        quantity_to_deduct = stock.total_quantity

        ExpiryTracker.objects.update_or_create(
            stock_item=stock,
            user=stock.user,
            batch_number=stock.batch_number,
            defaults={
                'expiry_date': stock.expiry_date,
                'remaining_days': (stock.expiry_date - today).days,
                'status': 'expiring',
                'stock_quantity': quantity_to_deduct,
                'can_request_return': stock.user.role == 'admin'
            }
        )

    print(f"✅ Processed {expiring_items.count()} expiring stock items on {today}")


def transfer_expired_orders_to_default_stockist():
    """
    Automatically transfer order requests to the default stockist
    if 24 hours have passed since the transfer_due_at deadline.
    """

    today = timezone.now()

    # Find orders that are still pending due to insufficient stock and expired
    expired_orders = OrderRequest.objects.filter(
        status="pending",
        transfer_due_at__lte=today
    )

    if not expired_orders.exists():
        print(f"✅ No expired order requests found on {today.strftime('%Y-%m-%d %H:%M:%S')}")
        return

    # Get default stockist
    default_stockist = User.objects.filter(role="stockist", is_default=True).first()
    if not default_stockist:
        print("❌ No default stockist configured. Skipping transfer.")
        return

    transferred_count = 0

    for order in expired_orders:
        try:
            with transaction.atomic():
                previous_stockist = order.target_user

                # Update target to default stockist
                order.target_user = default_stockist
                order.status = "pending"
                order.transfer_due_at = None
                order.save(update_fields=["target_user", "status", "transfer_due_at"])

                transferred_count += 1

                # 📨 Email notification to default stockist
                messages = [
                    f"Dear {default_stockist.username},",
                    f"New order request (ID: {order.request_id}) has been automatically transferred to you as a default stockist.",
                    "This happened because the previous stockist did not update their stock within 24 hours.",
                    "",
                    f"🆕 Old Stockist: {previous_stockist.username},User ID : {previous_stockist.unique_role_id}",
                    "You can review the order details in Under My Network > Order Requests(Reseller).",
                ]

                send_html_email(
                    to_email=order.requested_by.email,
                    subject="🔄New Order Request Recieved",
                    messages=messages
                )

                # 📨 Optional email to old stockist
                if previous_stockist:
                    send_html_email(
                        to_email=previous_stockist.email,
                        subject=f"⚠️ Order {order.request_id} Transferred Automatically",
                        messages=[
                            f"Dear {previous_stockist.username},",
                            f"The order request (ID: {order.request_id}) assigned to you has been automatically transferred.",
                            "This happened because it was not processed or stock was not updated within 24 hours.",
                            "Please review your stock to prevent future auto-transfers.",
                        ]
                    )

        except Exception as e:
            print(f"⚠️ Failed to transfer order {order.request_id}: {e}")

    print(f"🎯 Successfully transferred {transferred_count} expired order requests on {today.strftime('%Y-%m-%d %H:%M:%S')}")