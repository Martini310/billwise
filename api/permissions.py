from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to read or edit it.
    """

    message = 'You are not allowed to see or edit this content'

    def has_object_permission(self, request, view, obj):

        return obj.user == request.user
