# Generated by Django 4.2.2 on 2023-09-30 19:11

from django.db import migrations

def create_categories(apps, schema_editor):
    # We can't import the Person model directly as it may be a newer
    # version than this migration expects. We use the historical version.
    Category = apps.get_model("base", "Category")
    Category.objects.create(name='Gaz')
    Category.objects.create(name='Prąd')
    Category.objects.create(name='Woda')
    Category.objects.create(name='Paliwo')
    Category.objects.create(name='Inne')

def create_suppliers(apps, schema_editor):
    Supplier = apps.get_model("base", "Supplier")
    Supplier.objects.create(name="PGNiG", url="https://www.ebok.pgnig.pl")
    Supplier.objects.create(name="Enea", url="https://www.ebok.enea.pl")
    Supplier.objects.create(name="Aquanet", url="https://www.ebok.aquanet.pl")
    Supplier.objects.create(name="Orlen", url="https://www.orlen.pl")

class Migration(migrations.Migration):

    dependencies = [
        ('base', '0002_alter_account_supplier_alter_invoice_account_and_more'),
    ]

    operations = [
        migrations.RunPython(create_categories),
        migrations.RunPython(create_suppliers),
    ]
