from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Anyone can read. Only authenticated users can create.
    Only the tree's owner (or staff) can update or delete it.
    """

    message = "You must own this tree to modify it."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.is_staff:
            return True
        # Trees with no owner can only be modified by staff
        return obj.owner_id is not None and obj.owner_id == request.user.id


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Anyone can read. Only staff users can create, update or delete.
    Used for shared reference data such as the species catalogue.
    """

    message = "Only administrators can modify species."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)
