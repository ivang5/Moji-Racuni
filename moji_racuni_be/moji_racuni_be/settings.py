"""
Django settings for moji_racuni_be project.

For more information on this file, see
https://docs.djangoproject.com/en/stable/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/stable/ref/settings/
"""

from pathlib import Path
from datetime import timedelta
import os

from django.core.exceptions import ImproperlyConfigured


def _env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in ["1", "true", "yes", "on"]


def _env_int(name, default):
    value = os.getenv(name)
    if value is None or not value.strip():
        return default
    try:
        return int(value)
    except ValueError as e:
        raise ImproperlyConfigured(f"{name} mora biti ceo broj, dobijeno: {value!r}") from e


def _env_list(name, default):
    value = os.getenv(name)
    if not value:
        return default
    return [item.strip() for item in value.split(",") if item.strip()]

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


def _load_env_file(path):
    if not path.exists():
        return

    for line in path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue

        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip()

        if (
            (value.startswith('"') and value.endswith('"'))
            or (value.startswith("'") and value.endswith("'"))
        ):
            value = value[1:-1]

        os.environ.setdefault(key, value)


_load_env_file(BASE_DIR / '.env')


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/stable/howto/deployment/checklist/

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = _env_bool('DJANGO_DEBUG', False)

# SECURITY WARNING: keep the secret key used in production secret!
# Podrazumevani ključ postoji samo za lokalni razvoj (DEBUG); van njega aplikacija ne sme da se
# pokrene bez sopstvenog ključa, jer se njime potpisuju JWT tokeni.
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', '')
if not DEBUG and (not SECRET_KEY or SECRET_KEY.startswith('django-insecure-')):
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY mora biti postavljen na dugačku nasumičnu vrednost kada DJANGO_DEBUG nije "
        "uključen (npr. python -c \"from django.core.management.utils import get_random_secret_key; "
        "print(get_random_secret_key())\")."
    )
if not SECRET_KEY:
    SECRET_KEY = 'django-insecure-dev-only-change-me'

ALLOWED_HOSTS = _env_list('DJANGO_ALLOWED_HOSTS', ['localhost', '127.0.0.1', '0.0.0.0', 'testserver'])


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    'account.apps.AccountConfig',
    'company.apps.CompanyConfig',
    'receipt.apps.ReceiptConfig',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # Svaki endpoint traži prijavu; javni (prijava, refresh, registracija) to navode eksplicitno.
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # Ograničava samo view-ove sa atributom throttle_scope (prijava, refresh, registracija, lozinka).
    # Brojači su u podrazumevanom (lokalnom, po procesu) kešu; uz više procesa treba deljeni keš.
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.ScopedRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'login': os.getenv('THROTTLE_LOGIN_RATE', '10/min'),
        'token_refresh': os.getenv('THROTTLE_TOKEN_REFRESH_RATE', '30/min'),
        'register': os.getenv('THROTTLE_REGISTER_RATE', '10/hour'),
        'password': os.getenv('THROTTLE_PASSWORD_RATE', '10/hour'),
    },
}

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Ograničenja zahteva: telo bez fajlova (JSON, polja forme) najviše 1 MB, najviše 5 fajlova po zahtevu.
# Veličina slike preduzeća se proverava posebno (COMPANY_IMAGE_MAX_SIZE).
DATA_UPLOAD_MAX_MEMORY_SIZE = 1024 * 1024
DATA_UPLOAD_MAX_NUMBER_FILES = 5
COMPANY_IMAGE_MAX_SIZE = 2 * 1024 * 1024

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=_env_int('JWT_ACCESS_TOKEN_MINUTES', 30)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=_env_int('JWT_REFRESH_TOKEN_DAYS', 14)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,

    'ALGORITHM': 'HS256',
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',

    'JTI_CLAIM': 'jti',
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'moji_racuni_be.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'moji_racuni_be.wsgi.application'


# Database
# https://docs.djangoproject.com/en/stable/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DB_NAME', 'moji_racuni'),
        'USER': os.getenv('DB_USER', 'root'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'root'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '3306'),
        # Test baza (test_<NAME>) se pravi sa istim charset-om/collation-om kao glavna baza
        # (vidi README.md), da bi se testovi ponašali isto kao aplikacija (npr. LIKE/LOWER pod cp1250_bin).
        'TEST': {
            'CHARSET': os.getenv('DB_TEST_CHARSET', 'cp1250'),
            'COLLATION': os.getenv('DB_TEST_COLLATION', 'cp1250_bin'),
        },
    }
}


# Password validation
# https://docs.djangoproject.com/en/stable/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/stable/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/stable/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/stable/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = "account.User"

# HTTPS podešavanja (check --deploy). Podrazumevano su isključena, jer se aplikacija koristi i preko
# http://<ip> u lokalnoj mreži: SSL redirect bi takav pristup prekinuo, a "secure" kolačići (sesija i
# CSRF koriste samo Django admin; API radi sa JWT u zaglavlju) se preko http-a ne bi slali.
# Uključiti tek kada aplikacija radi iza HTTPS-a.
_https_enabled = _env_bool('DJANGO_HTTPS', False)
SECURE_SSL_REDIRECT = _https_enabled
SESSION_COOKIE_SECURE = _https_enabled
CSRF_COOKIE_SECURE = _https_enabled
# HSTS se u browser-u pamti i posle isključivanja, pa se uključuje posebno i tek kada HTTPS sigurno radi.
SECURE_HSTS_SECONDS = _env_int('DJANGO_SECURE_HSTS_SECONDS', 0)
SECURE_HSTS_INCLUDE_SUBDOMAINS = _env_bool('DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS', False)
# Samo iza reverse proxy-ja koji uvek postavlja X-Forwarded-Proto (inače klijent može da ga lažira).
if _env_bool('DJANGO_SECURE_PROXY_SSL_HEADER', False):
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


# Logovanje: upozorenja i greške (uključujući 5xx sa stack trace-om) idu u konzolu, a ako je
# postavljen DJANGO_LOG_FILE, i u fajl (rotira se na 5 MB, čuvaju se 3 stara fajla). U DEBUG-u
# Django beleži i INFO (kao podrazumevano), a biblioteke samo upozorenja. Logger "django.server"
# (zahtevi koje ispisuje runserver) se navodi eksplicitno, jer bi ga podešavanje "django" logger-a
# inače prebacilo na isti nivo i handler.
_LOG_LEVEL = os.getenv('DJANGO_LOG_LEVEL') or 'WARNING'
_DJANGO_LOG_LEVEL = os.getenv('DJANGO_LOG_LEVEL') or ('INFO' if DEBUG else 'WARNING')
_LOG_HANDLERS = ['console']
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '{asctime} {levelname} {name}: {message}',
            'style': '{',
        },
        'django.server': {
            '()': 'django.utils.log.ServerFormatter',
            'format': '[{server_time}] {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'standard',
        },
        'django.server': {
            'class': 'logging.StreamHandler',
            'formatter': 'django.server',
        },
    },
    'root': {
        'handlers': _LOG_HANDLERS,
        'level': _LOG_LEVEL,
    },
    'loggers': {
        'django': {
            'handlers': _LOG_HANDLERS,
            'level': _DJANGO_LOG_LEVEL,
            'propagate': False,
        },
        'django.server': {
            'handlers': ['django.server'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
if os.getenv('DJANGO_LOG_FILE'):
    LOGGING['handlers']['file'] = {
        'class': 'logging.handlers.RotatingFileHandler',
        'filename': os.getenv('DJANGO_LOG_FILE'),
        'maxBytes': 5 * 1024 * 1024,
        'backupCount': 3,
        'encoding': 'utf-8',
        'formatter': 'standard',
    }
    _LOG_HANDLERS.append('file')


# Domeni sa kojih se preuzimaju računi (link sa QR koda fiskalnog računa).
PURS_ALLOWED_HOSTS = _env_list('PURS_ALLOWED_HOSTS', ['suf.purs.gov.rs'])


CORS_ALLOW_ALL_ORIGINS = _env_bool('CORS_ALLOW_ALL_ORIGINS', False)

CORS_ALLOWED_ORIGINS = _env_list(
    'CORS_ALLOWED_ORIGINS',
    [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]
)
