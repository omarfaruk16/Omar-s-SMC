from django.urls import path
from config.api_error_handlers import api_handler404, api_handler500


handler404 = api_handler404
handler500 = api_handler500


def test_error_view(request):
    raise RuntimeError("forced test error")


urlpatterns = [
    path("api/test-error/", test_error_view),
]
