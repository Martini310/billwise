from django.contrib import admin
from .models import NewUser

@admin.register(NewUser)
class ProfileAdmin(admin.ModelAdmin):
    """ Model admin for Profile. """
    # List attributes.
    list_display = (
        'username',
        'id',
        'first_name',
        'email',
    )
    