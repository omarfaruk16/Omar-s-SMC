"""Reusable DRF permission classes for role-based access control.

These centralize the role checks that are currently duplicated inline across
viewsets (``if request.user.role != 'admin': ...``). New views should prefer
these; existing views can adopt them incrementally.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """Allow access only to authenticated admin users."""
    message = 'Admin access required.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == 'admin')


class IsTeacher(BasePermission):
    message = 'Teacher access required.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == 'teacher')


class IsStudent(BasePermission):
    message = 'Student access required.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == 'student')


class IsApproved(BasePermission):
    """Allow access only to accounts whose registration has been approved."""
    message = 'Your account is not approved yet.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, 'status', None) == 'approved')


class IsAdminOrReadOnly(BasePermission):
    """Read for any authenticated user; writes restricted to admins."""
    message = 'Admin access required to modify this resource.'

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return user.role == 'admin'
