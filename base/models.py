from django.db import models
from django.conf import settings

# Create your models here.


class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name}"


class Supplier(models.Model):
    name = models.CharField(max_length=100)
    url = models.URLField(null=True, blank=True)

    def __str__(self):
        return f"{self.name}"
    

class Account(models.Model):
    supplier = models.ForeignKey(to=Supplier, related_name='accounts', on_delete=models.CASCADE)
    login = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    user = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    category = models.ForeignKey(to=Category, on_delete=models.CASCADE)
    last_sync = models.DateTimeField("Ostatnia aktualizacja", auto_now=True)
    notification = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"[id:{self.pk}] Konto w {self.supplier.name} użytkownika {self.user.username}"


class Invoice(models.Model):
    number = models.CharField(max_length=100)
    date = models.DateField()
    amount = models.FloatField()
    pay_deadline = models.DateField()
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    amount_to_pay = models.FloatField(null=True, blank=True)
    wear = models.FloatField(null=True, blank=True)
    user = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_paid = models.BooleanField()
    consumption_point = models.CharField(max_length=100, null=True, blank=True)
    account = models.ForeignKey(to=Account, on_delete=models.CASCADE, null=True, blank=True)
    category = models.ForeignKey(to=Category, on_delete=models.CASCADE)
    bank_account_number = models.CharField(max_length=32, null=True, blank=True)
    transfer_title = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"[id:{self.pk}] Faktura nr {self.number} za {self.category} dla użytkownika {self.user.username}"

    class Meta:
        ordering = ['-date']
