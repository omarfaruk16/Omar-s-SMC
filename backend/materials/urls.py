from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClassMaterialViewSet

router = DefaultRouter()
router.register(r'', ClassMaterialViewSet, basename='material')

urlpatterns = [
    path('', include(router.urls)),
]
