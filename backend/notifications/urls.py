from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PushConfigView, PushSubscriptionViewSet

router = DefaultRouter()
router.register(r'push-subscriptions', PushSubscriptionViewSet, basename='push-subscription')

urlpatterns = [
    path('push-config/', PushConfigView.as_view(), name='push-config'),
    path('', include(router.urls)),
]
