from django.contrib import admin
from .models import Category, Supplier, Account, Invoice

# Register your models here.
admin.site.register(Category)
admin.site.register(Supplier)
admin.site.register(Account)
admin.site.register(Invoice)
