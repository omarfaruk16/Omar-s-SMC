import logging

from django.conf import settings
from django.http import JsonResponse
from django.views.defaults import page_not_found, server_error


logger = logging.getLogger(__name__)


def _is_api_request(request):
    return request.path.startswith('/api/')


def api_handler404(request, exception):
    if _is_api_request(request):
        return JsonResponse(
            {"detail": "Endpoint not found."},
            status=404,
        )
    return page_not_found(request, exception)


def api_handler500(request):
    if _is_api_request(request):
        return JsonResponse(
            {"detail": "Internal server error."},
            status=500,
        )
    return server_error(request)


class ApiExceptionMiddleware:
    """Return JSON for unhandled API exceptions to avoid HTML error pages."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        if not _is_api_request(request):
            return None

        logger.exception("Unhandled API exception", exc_info=exception)
        detail = str(exception) if settings.DEBUG else "Internal server error."
        return JsonResponse({"detail": detail}, status=500)
