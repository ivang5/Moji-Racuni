"""
Bezbednosna podešavanja iz env-a (moji_racuni_be/settings.py).

Settings se izvršava pri importu, pa se svaka kombinacija env varijabli proverava u zasebnom
procesu. Env varijable imaju prednost nad .env fajlom; prazna vrednost znači "podrazumevano".
"""
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

BE_DIR = Path(__file__).resolve().parents[2]
STRONG_KEY = "test-" + "x7Kp2mQ9vR4sT1wZ" * 4

PRINT_SETTINGS = """
import json
from moji_racuni_be import settings as s
print(json.dumps({
    "debug": s.DEBUG,
    "access_minutes": s.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds() / 60,
    "refresh_days": s.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].days,
    "ssl_redirect": s.SECURE_SSL_REDIRECT,
    "session_cookie_secure": s.SESSION_COOKIE_SECURE,
    "csrf_cookie_secure": s.CSRF_COOKIE_SECURE,
    "hsts_seconds": s.SECURE_HSTS_SECONDS,
    "proxy_ssl_header": getattr(s, "SECURE_PROXY_SSL_HEADER", None),
    "permissions": s.REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"],
}))
"""

#* Varijable koje test postavlja; one iz .env fajla (ako postoje) ovim se poništavaju
CONTROLLED_VARS = [
    "DJANGO_DEBUG", "DJANGO_SECRET_KEY", "JWT_ACCESS_TOKEN_MINUTES", "JWT_REFRESH_TOKEN_DAYS",
    "DJANGO_HTTPS", "DJANGO_SECURE_HSTS_SECONDS", "DJANGO_SECURE_PROXY_SSL_HEADER",
]


def _load_settings(**env_overrides):
    env = {**os.environ, **{name: "" for name in CONTROLLED_VARS}, **env_overrides}
    return subprocess.run(
        [sys.executable, "-c", PRINT_SETTINGS], cwd=BE_DIR, env=env, capture_output=True, text=True, timeout=60
    )


def _settings(**env_overrides):
    result = _load_settings(**env_overrides)
    assert result.returncode == 0, result.stderr
    return json.loads(result.stdout)


@pytest.mark.parametrize("secret_key", ["", "django-insecure-dev-only-change-me"], ids=["bez-kljuca", "insecure-kljuc"])
def test_production_refuses_to_start_without_secret_key(secret_key):
    result = _load_settings(DJANGO_DEBUG="False", DJANGO_SECRET_KEY=secret_key)

    assert result.returncode != 0
    assert "ImproperlyConfigured" in result.stderr
    assert "DJANGO_SECRET_KEY" in result.stderr


def test_production_starts_with_strong_secret_key():
    assert _settings(DJANGO_DEBUG="False", DJANGO_SECRET_KEY=STRONG_KEY)["debug"] is False


def test_debug_starts_without_secret_key():
    assert _settings(DJANGO_DEBUG="True")["debug"] is True


def test_defaults_are_safe_for_lan_http():
    s = _settings(DJANGO_DEBUG="False", DJANGO_SECRET_KEY=STRONG_KEY)

    assert (s["access_minutes"], s["refresh_days"]) == (30, 14)
    #* HTTPS podešavanja su podrazumevano isključena (pristup preko http://<ip> u lokalnoj mreži)
    assert (s["ssl_redirect"], s["session_cookie_secure"], s["csrf_cookie_secure"]) == (False, False, False)
    assert (s["hsts_seconds"], s["proxy_ssl_header"]) == (0, None)
    assert s["permissions"] == ["rest_framework.permissions.IsAuthenticated"]


def test_https_and_jwt_settings_from_env():
    s = _settings(
        DJANGO_DEBUG="False",
        DJANGO_SECRET_KEY=STRONG_KEY,
        JWT_ACCESS_TOKEN_MINUTES="15",
        JWT_REFRESH_TOKEN_DAYS="7",
        DJANGO_HTTPS="True",
        DJANGO_SECURE_HSTS_SECONDS="3600",
        DJANGO_SECURE_PROXY_SSL_HEADER="True",
    )

    assert (s["access_minutes"], s["refresh_days"]) == (15, 7)
    assert (s["ssl_redirect"], s["session_cookie_secure"], s["csrf_cookie_secure"]) == (True, True, True)
    assert s["hsts_seconds"] == 3600
    assert s["proxy_ssl_header"] == ["HTTP_X_FORWARDED_PROTO", "https"]


def test_invalid_integer_env_value_is_reported():
    result = _load_settings(DJANGO_DEBUG="True", JWT_ACCESS_TOKEN_MINUTES="pola sata")

    assert result.returncode != 0
    assert "JWT_ACCESS_TOKEN_MINUTES" in result.stderr
