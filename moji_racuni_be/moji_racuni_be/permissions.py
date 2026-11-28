"""
Provere uloga za DRF view-ove.

Neprijavljen korisnik dobija 401 (DRF to radi sam kada permisija odbije zahtev bez autentifikacije),
a prijavljen korisnik bez odgovarajuće uloge 403. Vlasništvo nad objektima se ne proverava ovde,
nego ograničavanjem upita na objekte trenutnog korisnika (tuđi objekat -> 404).
"""
from rest_framework.permissions import BasePermission

from account.models import User


def _has_role(request, role):
    user = request.user
    return bool(user and user.is_authenticated and getattr(user, "role", None) == role)


class IsAdminRole(BasePermission):
    """Prijavljen korisnik sa ulogom ADMIN."""

    def has_permission(self, request, view):
        return _has_role(request, User.Role.ADMIN)


class IsRegularRole(BasePermission):
    """Prijavljen korisnik sa ulogom REGULAR."""

    def has_permission(self, request, view):
        return _has_role(request, User.Role.REGULAR)
