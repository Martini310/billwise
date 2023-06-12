from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class Media(models.Model):
    name = models.CharField(max_length=100)


class Supplier(models.Model):
    name = models.CharField(max_length=100)
    media = models.ManyToManyField(to=Media)


class Invoice(models.Model):
    number = models.CharField(max_length=100)
    date = models.DateField()
    amount = models.FloatField()
    pay_date = models.DateField()
    start_date = models.DateField()
    end_date = models.DateField()
    amount_to_pay = models.FloatField()
    wear = models.FloatField()
    provider = models.ForeignKey(to=Supplier, on_delete=models.CASCADE)
    user = models.ForeignKey(to=User, on_delete=models.CASCADE)
    is_paid = models.BooleanField()
    consumption_point = models.CharField(max_length=100)
