from django.contrib import admin
from .models import Category, Supplier, Account, Invoice

admin.site.register(Category)
admin.site.register(Supplier)


@admin.register(Account)
class ProfileAdmin(admin.ModelAdmin):
    """ Model admin for Account. """
    # List attributes.
    list_display = (
        '__str__',
        'id',
        'supplier',
        'category',
        'user',
        'last_sync',
    )

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    """ Model admin for Invoice. """
    # List attributes.
    list_display = (
        '__str__',
        'id',
        'account',
        'category',
        'user',
    )
