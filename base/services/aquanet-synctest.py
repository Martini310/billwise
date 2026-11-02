"""
Ręczny test integracji Aquanet (login + 2FA TOTP + pobranie faktur).
Uruchom: venv/bin/python manage.py shell -c "exec(open('base/services/aquanet-synctest.py').read())"
Wymaga: konto Aquanet (id podany niżej) z uzupełnionym polem totp_secret.
"""
import requests, urllib3
from base.models import Account
from base.services.suppliers.aquanet import SyncAquanet
urllib3.disable_warnings()

ACCOUNT_ID = 2  # konto Aquanet użytkownika a@a.pl

acc = Account.objects.get(pk=ACCOUNT_ID)
print(f"Konto: {acc} | login={acc.login} | totp_secret={'ustawiony' if acc.totp_secret else 'BRAK'}")

obj = SyncAquanet(acc.user_id, acc.pk)
with requests.Session() as s:
    obj.login(s)
    print("Login + 2FA OK")
    raw = obj.get_invoices(s)
    print(f"Pobrano faktur: {len(raw['invoices'])}")
    parsed = obj.parse_invoices(raw)
    for inv in parsed[:5]:
        print(f"  {inv['number']} | {inv['date'].date()} | {inv['amount']} zł | zapłacona={inv['is_paid']} | do zapłaty={inv['amount_to_pay']}")
