from rest_framework_simplejwt.tokens import RefreshToken
from  .models import Notification,User,ActivityLog
from django.core.mail import send_mail
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.utils import timezone

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def generate_unique_role_id(role):
    prefix = {'vendor': 'VID', 'stockist': 'SID', 'reseller': 'RID'}[role]
    field = f"{role}_id"
    existing_ids = User.objects.filter(**{f"{field}__isnull": False}).values_list(field, flat=True)
    nums = [
        int(id_.replace(prefix, '')) for id_ in existing_ids if id_.startswith(prefix) and id_.replace(prefix, '').isdigit()
    ]
    next_number = max(nums, default=0) + 1
    return f"{prefix}{str(next_number).zfill(5)}"


def create_notification(user, title, message, notification_type='system', related_url=''):

    if user:
        Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            related_url=related_url or ''
        )


def send_email_to_user(to_email, subject, message):
    send_mail(
        subject=subject,
        message=message,
        from_email="stocktn.com@gmail.com",
        recipient_list=[to_email],
        fail_silently=False,
    )


def send_template_email(to_email, subject, message, html=False, link=None, link_text="Click here"):
    """
    Send email to a user.
    - If `html=True`, sends a styled HTML email (with optional link)
    - Otherwise, sends plain text email
    """

    from_email = "stocktn.com@gmail.com"

    try:
        if html:
            # Plain text fallback
            text_content = message
            if link:
                text_content += f"\n\n{link_text}: {link}"

            # HTML content
            html_content = f"""
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
                <p>{message}</p>
                {f'<p><a href="{link}" style="color:#1a73e8; text-decoration:none;">{link_text}</a></p>' if link else ""}
                <br>
                <p style="font-size: 13px; color: #666;">Best regards,<br><strong>Kutom Team</strong></p>
              </body>
            </html>
            """

            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=[to_email],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)

        else:
            # Plain text email
            send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=[to_email],
                fail_silently=False,
            )

    except Exception as e:
        # Log email errors without interrupting the flow
        print(f"Error sending email to {to_email}: {e}")