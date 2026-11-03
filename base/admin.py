from django.contrib import admin
from .models import Category, Supplier, Account, Invoice, Group, RecurringPayment

admin.site.register(Category)
admin.site.register(Supplier)
admin.site.register(RecurringPayment)


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    """ Model admin for Group. """
    list_display = ('__str__', 'id', 'color', 'user', 'created')


@admin.register(Account)
class ProfileAdmin(admin.ModelAdmin):
    """ Model admin for Account. """
    # List attributes.
    list_display = (
        '__str__',
        'id',
        'supplier',
        'category',
        'group',
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
