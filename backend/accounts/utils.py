from rest_framework_simplejwt.tokens import RefreshToken
from  .models import Notification
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