from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TestimonialRequestViewSet, TestimonialInitView, TestimonialIPNView, TestimonialReturnView

router = DefaultRouter()
router.register(r'testimonials', TestimonialRequestViewSet, basename='testimonial')

urlpatterns = [
    path('testimonials/sslcommerz/init/', TestimonialInitView.as_view(), name='testimonial-sslcommerz-init'),
    path('testimonials/sslcommerz/ipn/', TestimonialIPNView.as_view(), name='testimonial-sslcommerz-ipn'),
    path('testimonials/sslcommerz/return/', TestimonialReturnView.as_view(), name='testimonial-sslcommerz-return'),
    path('', include(router.urls)),
]
