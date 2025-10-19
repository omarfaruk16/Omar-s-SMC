from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeeViewSet, PaymentViewSet

router = DefaultRouter()
router.register(r'fees', FeeViewSet, basename='fee')
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
]
