from rest_framework_simplejwt.tokens import RefreshToken
from  .models import Notification,User
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def create_notification(user, title, message, notification_type='system', related_url=None):
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        related_url=related_url
    )


def generate_unique_role_id(role):
    prefix = {'vendor': 'VID', 'stockist': 'SID', 'reseller': 'RID'}[role]
    field = f"{role}_id"
    existing_ids = User.objects.filter(**{f"{field}__isnull": False}).values_list(field, flat=True)
    nums = [
        int(id_.replace(prefix, '')) for id_ in existing_ids if id_.startswith(prefix) and id_.replace(prefix, '').isdigit()
    ]
    next_number = max(nums, default=0) + 1
    return f"{prefix}{str(next_number).zfill(5)}"
