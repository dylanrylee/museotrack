"""
Django settings for backend project.
Compatible with local dev (.env) and Docker (backend.env).
"""

from pathlib import Path
import os

# ------------------------------------------------------
# Paths
# ------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

# ------------------------------------------------------
# Environment loading (python-dotenv in dev only)
# ------------------------------------------------------
if os.getenv("DEBUG", os.getenv("DJANGO_DEBUG", "0")).lower() in {"1", "true", "yes"}:
    try:
        from dotenv import load_dotenv
        dotenv_path = BASE_DIR / ".env"
        if dotenv_path.exists():
            load_dotenv(dotenv_path)
    except Exception:
        pass

# ------------------------------------------------------
# Core security
# ------------------------------------------------------
SECRET_KEY = (
    os.getenv("SECRET_KEY")
    or os.getenv("DJANGO_SECRET_KEY")
    or "insecure-default-key-change-me"
)

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY must be set via env vars")

DEBUG = os.getenv("DEBUG", os.getenv("DJANGO_DEBUG", "0")).lower() in {"1", "true", "yes"}

ALLOWED_HOSTS = [h for h in os.getenv("ALLOWED_HOSTS", "*").split(",") if h]

# ------------------------------------------------------
# Applications
# ------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
    # Local
    "api",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    )
}

# ------------------------------------------------------
# Middleware
# ------------------------------------------------------
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

# ------------------------------------------------------
# Database
# ------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    import dj_database_url
    DATABASES = {"default": dj_database_url.parse(DATABASE_URL)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.getenv("DB_NAME", "museotrack"),
            "USER": os.getenv("DB_USER", "museouser"),
            "PASSWORD": os.getenv("DB_PASSWORD", "museopass"),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "3306"),
            "OPTIONS": {"charset": "utf8mb4"},
        }
    }

# ------------------------------------------------------
# Password validation
# ------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ------------------------------------------------------
# Internationalization
# ------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = os.getenv("TIME_ZONE", "UTC")
USE_I18N = True
USE_TZ = True

# ------------------------------------------------------
# Static & Media
# ------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

USE_S3 = os.getenv("USE_S3", "0").lower() in {"1", "true", "yes"}
if USE_S3:
    INSTALLED_APPS += ["storages"]
    AWS_STORAGE_BUCKET_NAME = os.environ["AWS_STORAGE_BUCKET_NAME"]
    AWS_S3_REGION_NAME = os.getenv("AWS_REGION", "us-east-1")
    AWS_S3_SIGNATURE_VERSION = "s3v4"
    AWS_DEFAULT_ACL = None
    AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}
    STATICFILES_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
    STATIC_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/"

# ------------------------------------------------------
# CORS / CSRF
# ------------------------------------------------------
_cors_origins = [
    o for o in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o
]
CORS_ALLOWED_ORIGINS = _cors_origins
CORS_ALLOW_CREDENTIALS = True

_csrf_origins = [
    o for o in os.getenv("CSRF_TRUSTED_ORIGINS", ",".join(_cors_origins)).split(",") if o
]
CSRF_TRUSTED_ORIGINS = _csrf_origins
CSRF_COOKIE_HTTPONLY = False

# ------------------------------------------------------
# Security (prod only)
# ------------------------------------------------------
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "1") == "1"
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# ------------------------------------------------------
# Defaults
# ------------------------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ------------------------------------------------------
# Logging (stdout for Docker)
# ------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": os.getenv("LOG_LEVEL", "INFO")},
}
