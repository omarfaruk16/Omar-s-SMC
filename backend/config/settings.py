
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

# Get the environment mode (development or production)
MODE = config('MODE', default='development')

# In production, let Nginx serve media files; in development, Django serves them
SERVE_MEDIA = config('SERVE_MEDIA', default=(MODE != 'production'), cast=bool)

ALLOWED_HOSTS = [h.strip() for h in config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',') if h.strip()]


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
    "config.api_error_handlers.ApiExceptionMiddleware",
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
                "django.template.context_processors.static",
                "django.template.context_processors.media",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

# Configure database based on the mode
if MODE == 'production':
    # PostgreSQL for production
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='smsp'),
            'USER': config('DB_USER', default='omar'),
            # No hardcoded credential default — must be supplied via environment.
            'PASSWORD': config('DB_PASSWORD'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
            'CONN_MAX_AGE': 600,
        }
    }
else:
    # SQLite for development
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
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

# Ensure uploaded files are world-readable so nginx (www-data) can serve them
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755


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
    # NOTE: Global pagination intentionally disabled. The React admin lists read
    # responses as plain arrays and do not follow `next` links, so a global
    # PAGE_SIZE silently hid every record past the first page (e.g. subjects,
    # users, classes capped at 20). Endpoints that need paging can opt in with
    # an explicit `pagination_class`.
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/min',
        'user': '1000/hour',
        'auth': '10/min',   # login endpoint
        'otp': '5/min',     # forgot-password / verify-otp / reset
    },
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
SSLCOMMERZ_TESTIMONIAL_IPN_URL = config('SSLCOMMERZ_TESTIMONIAL_IPN_URL', default='http://localhost:8000/api/testimonials/sslcommerz/ipn/')
SSLCOMMERZ_ADMISSION_IPN_URL = config('SSLCOMMERZ_ADMISSION_IPN_URL', default='http://localhost:8000/api/admissions/sslcommerz/ipn/')
SSLCOMMERZ_CURRENCY = config('SSLCOMMERZ_CURRENCY', default='BDT')
ADMISSION_FORM_FEE_AMOUNT = config('ADMISSION_FORM_FEE_AMOUNT', default=3500, cast=int)
TRANSCRIPT_FEE_AMOUNT = config('TRANSCRIPT_FEE_AMOUNT', default=3500, cast=int)
TESTIMONIAL_FEE_AMOUNT = config('TESTIMONIAL_FEE_AMOUNT', default=TRANSCRIPT_FEE_AMOUNT, cast=int)

# Web Push Configuration
WEBPUSH_PUBLIC_KEY = config('WEBPUSH_PUBLIC_KEY', default='')
WEBPUSH_PRIVATE_KEY = config('WEBPUSH_PRIVATE_KEY', default='')
WEBPUSH_SUBJECT = config('WEBPUSH_SUBJECT', default='mailto:admin@example.com')

# Security hardening — applied automatically when DEBUG is off (production)
if not DEBUG:
    _insecure_key = (
        not SECRET_KEY
        or SECRET_KEY.startswith('django-insecure-')
        or SECRET_KEY.lower().startswith('your-')
        or 'secret-key-here' in SECRET_KEY.lower()
        or len(SECRET_KEY) < 32
    )
    if _insecure_key:
        raise RuntimeError(
            'Refusing to start with DEBUG=False and an insecure/placeholder SECRET_KEY. '
            'Generate one with: python -c "from django.core.management.utils import '
            'get_random_secret_key as g; print(g())" and set it in the environment.'
        )
    SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=31536000, cast=int)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    X_FRAME_OPTIONS = 'DENY'

# Console logging so unhandled errors surface in production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {'verbose': {'format': '{asctime} {levelname} {name} {message}', 'style': '{'}},
    'handlers': {'console': {'class': 'logging.StreamHandler', 'formatter': 'verbose'}},
    'root': {'handlers': ['console'], 'level': 'INFO'},
}
