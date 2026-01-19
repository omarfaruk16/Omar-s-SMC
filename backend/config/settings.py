
from pathlib import Path
import os
from decouple import config
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default="django-insecure-@a1%oy8d4mf+1id_4j+17+&$&@zg#e!^zge&r5nqv8+b+el_v!")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party apps
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    # Local apps
    "users",
    "classes",
    "notices",
    "results",
    "materials",
    "academics",
    "fees",
    "admissions",
    "transcripts",
    "notifications",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

# Use PostgreSQL in production, SQLite in development
if config('DATABASE_URL', default=None):
    DATABASES = {
        'default': dj_database_url.config(
            default=config('DATABASE_URL'),
            conn_max_age=600
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Dhaka"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = "/django-static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Security Settings for Production
CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', default='http://localhost:3000').split(',')
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Media files
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Custom User Model
AUTH_USER_MODEL = "users.User"

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# JWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://127.0.0.1:3000'
).split(',')

CORS_ALLOW_CREDENTIALS = True

# Frontend Base URL (for payment redirects)
FRONTEND_BASE_URL = config('FRONTEND_BASE_URL', default='http://localhost:3000')

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@schoolsms.com')

# OTP Configuration
OTP_LENGTH = config('OTP_LENGTH', default=6, cast=int)
OTP_EXPIRY_MINUTES = config('OTP_EXPIRY_MINUTES', default=10, cast=int)
OTP_MAX_ATTEMPTS = config('OTP_MAX_ATTEMPTS', default=5, cast=int)

# SSLCOMMERZ Configuration
SSLCOMMERZ_SANDBOX = config('SSLCOMMERZ_SANDBOX', default=True, cast=bool)
SSLCOMMERZ_STORE_ID = config('SSLCOMMERZ_STORE_ID', default='')
SSLCOMMERZ_STORE_PASSWORD = config('SSLCOMMERZ_STORE_PASSWORD', default='')
SSLCOMMERZ_SANDBOX_STORE_ID = config('SSLCOMMERZ_SANDBOX_STORE_ID', default='')
SSLCOMMERZ_SANDBOX_STORE_PASSWORD = config('SSLCOMMERZ_SANDBOX_STORE_PASSWORD', default='')
SSLCOMMERZ_LIVE_STORE_ID = config('SSLCOMMERZ_LIVE_STORE_ID', default='')
SSLCOMMERZ_LIVE_STORE_PASSWORD = config('SSLCOMMERZ_LIVE_STORE_PASSWORD', default='')
if SSLCOMMERZ_SANDBOX:
    SSLCOMMERZ_STORE_ID = SSLCOMMERZ_SANDBOX_STORE_ID or SSLCOMMERZ_STORE_ID
    SSLCOMMERZ_STORE_PASSWORD = SSLCOMMERZ_SANDBOX_STORE_PASSWORD or SSLCOMMERZ_STORE_PASSWORD
else:
    SSLCOMMERZ_STORE_ID = SSLCOMMERZ_LIVE_STORE_ID or SSLCOMMERZ_STORE_ID
    SSLCOMMERZ_STORE_PASSWORD = SSLCOMMERZ_LIVE_STORE_PASSWORD or SSLCOMMERZ_STORE_PASSWORD
SSLCOMMERZ_SUCCESS_URL = config('SSLCOMMERZ_SUCCESS_URL', default='http://localhost:3000/payment/success')
SSLCOMMERZ_FAIL_URL = config('SSLCOMMERZ_FAIL_URL', default='http://localhost:3000/payment/fail')
SSLCOMMERZ_CANCEL_URL = config('SSLCOMMERZ_CANCEL_URL', default='http://localhost:3000/payment/cancel')
SSLCOMMERZ_IPN_URL = config('SSLCOMMERZ_IPN_URL', default='http://localhost:8000/api/payments/sslcommerz/ipn/')
SSLCOMMERZ_TRANSCRIPT_IPN_URL = config('SSLCOMMERZ_TRANSCRIPT_IPN_URL', default='http://localhost:8000/api/transcripts/sslcommerz/ipn/')
SSLCOMMERZ_ADMISSION_IPN_URL = config('SSLCOMMERZ_ADMISSION_IPN_URL', default='http://localhost:8000/api/admissions/sslcommerz/ipn/')
SSLCOMMERZ_CURRENCY = config('SSLCOMMERZ_CURRENCY', default='BDT')
ADMISSION_FORM_FEE_AMOUNT = config('ADMISSION_FORM_FEE_AMOUNT', default=3500, cast=int)
TRANSCRIPT_FEE_AMOUNT = config('TRANSCRIPT_FEE_AMOUNT', default=3500, cast=int)

# Web Push Configuration
WEBPUSH_PUBLIC_KEY = config('WEBPUSH_PUBLIC_KEY', default='')
WEBPUSH_PRIVATE_KEY = config('WEBPUSH_PRIVATE_KEY', default='')
WEBPUSH_SUBJECT = config('WEBPUSH_SUBJECT', default='mailto:admin@example.com')
