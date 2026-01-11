import time
import json
from django.utils.deprecation import MiddlewareMixin
from django.utils.timezone import now
from accounts.models import ActivityLog


class APILoggingMiddleware(MiddlewareMixin):
    """
    Logs failed/error API responses (non-2xx) safely.
    Applies ONLY to /api/ endpoints.
    """

    def process_request(self, request):
        path = request.path

        # ✅ Skip admin, static, media, non-API
        if (
            path.startswith("/admin/")
            or path.startswith("/static/")
            or path.startswith("/media/")
            or not path.startswith("/api/")
        ):
            return None

        request.start_time = time.time()

        # Only attempt body logging for write methods
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            try:
                if request.content_type and "application/json" in request.content_type:
                    body_data = json.loads(request.body.decode("utf-8"))
                else:
                    body_data = dict(request.POST)

                request._log_body = json.dumps(
                    body_data, ensure_ascii=False
                )[:2000]  # limit 2KB
            except Exception:
                request._log_body = None
        else:
            request._log_body = None

        return None

    def process_response(self, request, response):
        path = request.path

        # ✅ Skip admin, static, media, non-API
        if (
            path.startswith("/admin/")
            or path.startswith("/static/")
            or path.startswith("/media/")
            or not path.startswith("/api/")
        ):
            return response

        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return response

        # Skip successful responses
        if 200 <= response.status_code < 300:
            return response

        duration = round(
            time.time() - getattr(request, "start_time", time.time()), 2
        )

        method = request.method
        action = (
            "update" if method in ["POST", "PUT", "PATCH"]
            else "delete" if method == "DELETE"
            else "read"
        )

        ActivityLog.objects.create(
            user=user,
            method=method,
            url=path,
            action=action,
            status_code=response.status_code,
            description=f"❌ {method} {path} failed with {response.status_code} ({duration}s)",
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:255],
            body=getattr(request, "_log_body", None),
            created_at=now(),
        )

        return response

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0]
        return request.META.get("REMOTE_ADDR")
