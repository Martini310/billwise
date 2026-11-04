from django.db import models
from django.conf import settings

class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name}"


class Supplier(models.Model):
    name = models.CharField(max_length=100)
    url = models.URLField(null=True, blank=True)

    def __str__(self):
        return f"{self.name}"
    

class Group(models.Model):
    """Zbiór dostawców użytkownika (np. 'Dom 1', 'Dom 2', 'Rodzice')."""
    name = models.CharField("Nazwa grupy", max_length=100)
    color = models.CharField("Kolor", max_length=9, default="#6366F1",
                             help_text="Kolor używany na przełączniku i chipie grupy.")
    user = models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='account_groups', on_delete=models.CASCADE)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name}"


class Account(models.Model):
    supplier = models.ForeignKey(to=Supplier, related_name='accounts', on_delete=models.CASCADE)
    login = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    totp_secret = models.CharField("Sekret TOTP (2FA)", max_length=128, null=True, blank=True,
                                   help_text="Sekret base32 z aplikacji authenticator. Pozwala automatycznie generować kod 2FA.")
    device_token = models.TextField("Token zaufanego urządzenia", null=True, blank=True,
                                     help_text="Token zapamiętanego urządzenia (np. Orange AUTH_DEVICE_TOKEN). Pozwala logować się bez SMS po jednorazowej konfiguracji.")
    user = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    category = models.ForeignKey(to=Category, on_delete=models.CASCADE)
    group = models.ForeignKey(to=Group, related_name='accounts', null=True, blank=True,
                              on_delete=models.SET_NULL)
    last_sync = models.DateTimeField("Ostatnia aktualizacja", auto_now=True)
    notification = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"[id:{self.pk}] Konto w {self.supplier.name} użytkownika {self.user.username}"


class RecurringPayment(models.Model):
    """Cykliczna opłata spoza dostawców (np. czynsz, śmieci) — generuje faktury."""
    name = models.CharField("Nazwa", max_length=100)
    amount = models.FloatField("Kwota", null=True, blank=True)
    amount_variable = models.BooleanField("Kwota zmienna", default=False)
    category = models.ForeignKey(to=Category, on_delete=models.CASCADE)
    group = models.ForeignKey(to=Group, related_name='recurring_payments', null=True, blank=True,
                              on_delete=models.SET_NULL)
    user = models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='recurring_payments', on_delete=models.CASCADE)
    day = models.PositiveSmallIntegerField("Dzień miesiąca", default=1)
    interval_months = models.PositiveSmallIntegerField("Co ile miesięcy", default=1)
    start_date = models.DateField("Od")
    bank_account_number = models.CharField(max_length=32, null=True, blank=True)
    transfer_title = models.CharField(max_length=100, null=True, blank=True)
    active = models.BooleanField("Aktywna", default=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name}"


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
    recurring = models.ForeignKey(to=RecurringPayment, related_name='invoices', null=True, blank=True,
                                  on_delete=models.SET_NULL)
    category = models.ForeignKey(to=Category, on_delete=models.CASCADE)
    bank_account_number = models.CharField(max_length=32, null=True, blank=True)
    transfer_title = models.CharField(max_length=100, null=True, blank=True)
    estimated = models.BooleanField("Szacowana (do uzupełnienia)", default=False)

    def __str__(self):
        return f"[id:{self.pk}] Faktura nr {self.number} za {self.category} dla użytkownika {self.user.username}"

    class Meta:
        ordering = ['-date']
