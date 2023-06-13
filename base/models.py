from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class Media(models.Model):
    name = models.CharField(max_length=100)


class Supplier(models.Model):
    name = models.CharField(max_length=100)
    media = models.ManyToManyField(to=Media)
    url = models.URLField()


class Account(models.Model):
    supplier = models.ForeignKey(to=Supplier, on_delete=models.CASCADE)
    login = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    user = models.ForeignKey(to=User, on_delete=models.CASCADE)


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
    user = models.ForeignKey(to=User, on_delete=models.CASCADE)
    is_paid = models.BooleanField()
    consumption_point = models.CharField(max_length=100, null=True, blank=True)
