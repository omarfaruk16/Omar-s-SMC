from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeeViewSet, PaymentViewSet, SSLCommerzInitView, SSLCommerzIPNView

router = DefaultRouter()
router.register(r'fees', FeeViewSet, basename='fee')
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('payments/sslcommerz/init/', SSLCommerzInitView.as_view(), name='sslcommerz-init'),
    path('payments/sslcommerz/ipn/', SSLCommerzIPNView.as_view(), name='sslcommerz-ipn'),
    path('', include(router.urls)),
]
