from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdmissionFormDownloadView,
    AdmissionFormIPNView,
    AdmissionFormInitView,
    AdmissionFormSubmissionViewSet,
    AdmissionFormTemplateViewSet,
    RegistrationAdmissionFormDownloadView,
)

router = DefaultRouter()
router.register("templates", AdmissionFormTemplateViewSet, basename="admission-form-template")
router.register("submissions", AdmissionFormSubmissionViewSet, basename="admission-form-submission")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "registration/download/",
        RegistrationAdmissionFormDownloadView.as_view(),
        name="admission-registration-download",
    ),
    path("sslcommerz/init/", AdmissionFormInitView.as_view(), name="admission-sslcommerz-init"),
    path("sslcommerz/ipn/", AdmissionFormIPNView.as_view(), name="admission-sslcommerz-ipn"),
    path("submissions/download/", AdmissionFormDownloadView.as_view(), name="admission-submission-download"),
]
