from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

# Create your models here.


class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name}"


class Supplier(models.Model):
    name = models.CharField(max_length=100)
    media = models.ForeignKey(to=Category, on_delete=models.CASCADE)
    url = models.URLField()

    def __str__(self):
        return f"{self.name} - {self.media}"
    

class Account(models.Model):
    supplier = models.ForeignKey(to=Supplier, on_delete=models.CASCADE)
    login = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    user = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE)


class Invoice(models.Model):
    number = models.CharField(max_length=100)
    date = models.DateField()
    amount = models.FloatField()
    pay_deadline = models.DateField()
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    amount_to_pay = models.FloatField(null=True, blank=True)
    wear = models.FloatField(null=True, blank=True)
    supplier = models.ForeignKey(to=Supplier, on_delete=models.CASCADE)
    user = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_paid = models.BooleanField()
    consumption_point = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"Faktura nr {self.number} za {self.supplier} dla {self.user.user_name}"
