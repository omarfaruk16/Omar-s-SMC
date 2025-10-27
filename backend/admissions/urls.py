from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdmissionFormTemplateViewSet, RegistrationAdmissionFormDownloadView

router = DefaultRouter()
router.register("templates", AdmissionFormTemplateViewSet, basename="admission-form-template")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "registration/download/",
        RegistrationAdmissionFormDownloadView.as_view(),
        name="admission-registration-download",
    ),
]
