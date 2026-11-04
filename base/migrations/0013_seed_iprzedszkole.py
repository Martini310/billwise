from django.db import migrations


def seed(apps, schema_editor):
    Supplier = apps.get_model('base', 'Supplier')
    Category = apps.get_model('base', 'Category')
    Supplier.objects.get_or_create(name='iPrzedszkole')
    Category.objects.get_or_create(name='Przedszkole')


def unseed(apps, schema_editor):
    Supplier = apps.get_model('base', 'Supplier')
    Supplier.objects.filter(name='iPrzedszkole').delete()
    # Kategorii "Przedszkole" nie usuwamy — mogą z niej korzystać inne rekordy.


class Migration(migrations.Migration):
    dependencies = [
        ('base', '0012_invoice_estimated_recurringpayment_amount_variable_and_more'),
    ]
    operations = [migrations.RunPython(seed, unseed)]
