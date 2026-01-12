import json

from django.conf import settings
from pywebpush import webpush, WebPushException


class WebPushError(Exception):
    def __init__(self, message, status_code=None):
        super().__init__(message)
        self.status_code = status_code


def send_web_push(subscription, payload):
    if not settings.WEBPUSH_PRIVATE_KEY or not settings.WEBPUSH_PUBLIC_KEY:
        raise WebPushError('Web push keys are not configured')

    subscription_info = {
        'endpoint': subscription.endpoint,
        'keys': {
            'p256dh': subscription.p256dh,
            'auth': subscription.auth,
        },
    }
    try:
        return webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=settings.WEBPUSH_PRIVATE_KEY,
            vapid_claims={'sub': settings.WEBPUSH_SUBJECT},
        )
    except WebPushException as exc:
        status_code = getattr(exc.response, 'status_code', None)
        raise WebPushError(str(exc), status_code=status_code) from exc
