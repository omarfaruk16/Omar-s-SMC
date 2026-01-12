from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TranscriptRequestViewSet, TranscriptInitView, TranscriptIPNView

router = DefaultRouter()
router.register(r'transcripts', TranscriptRequestViewSet, basename='transcript')

urlpatterns = [
    path('transcripts/sslcommerz/init/', TranscriptInitView.as_view(), name='transcript-sslcommerz-init'),
    path('transcripts/sslcommerz/ipn/', TranscriptIPNView.as_view(), name='transcript-sslcommerz-ipn'),
    path('', include(router.urls)),
]
