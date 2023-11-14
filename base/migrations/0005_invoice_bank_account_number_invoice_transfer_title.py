# Generated by Django 4.2.2 on 2023-11-12 20:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0004_alter_invoice_options_remove_invoice_supplier_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='bank_account_number',
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
        migrations.AddField(
            model_name='invoice',
            name='transfer_title',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]