"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.urls import re_path
from rest_framework_simplejwt.views import TokenRefreshView
from users.authentication import CustomTokenObtainPairView
from users.views import ForgotPasswordView, VerifyOTPView, ResetPasswordView
from config.api_error_handlers import api_handler404, api_handler500

handler404 = api_handler404
handler500 = api_handler500

urlpatterns = [
    path("admin/", admin.site.urls),

    # JWT Authentication
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('api/auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('api/auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    
    # Public API endpoints
    path('api/public/', include('users.public_urls')),

    # API endpoints
    path('api/academics/', include('academics.urls')),
    path('api/users/', include('users.urls')),
    path('api/classes/', include('classes.urls')),
    path('api/notices/', include('notices.urls')),
    path('api/results/', include('results.urls')),
    path('api/materials/', include('materials.urls')),
    path('api/admissions/', include('admissions.urls')),
    path('api/', include('fees.urls')),
    path('api/', include('transcripts.urls')),
    path('api/notifications/', include('notifications.urls')),
]

# Serve media files
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
elif getattr(settings, 'SERVE_MEDIA', False):
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
        re_path(r'^django-static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
    ]
