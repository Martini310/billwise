"""Generowanie faktur z cyklicznych opłat (czynsz, śmieci itp.)."""
from datetime import date
from ..models import RecurringPayment, Invoice


def generate_recurring_invoices(user):
    """Tworzy brakujące faktury dla aktywnych opłat cyklicznych użytkownika —
    od start_date do bieżącego miesiąca, krokiem co ``interval_months``.
    Faktury powstają jako NIEzapłacone (użytkownik odhacza ręcznie)."""
    today = date.today()
    created = 0
    for rp in RecurringPayment.objects.filter(user=user, active=True):
        year, month = rp.start_date.year, rp.start_date.month
        step = max(1, rp.interval_months)
        while (year, month) <= (today.year, today.month):
            number = f"{rp.name} {year:04d}-{month:02d}"
            if not Invoice.objects.filter(number=number, user=user).exists():
                due = date(year, month, min(max(rp.day, 1), 28))
                Invoice.objects.create(
                    number=number,
                    date=due,
                    amount=rp.amount,
                    pay_deadline=due,
                    amount_to_pay=rp.amount,
                    user=user,
                    is_paid=False,
                    category=rp.category,
                    recurring=rp,
                    account=None,
                    bank_account_number=rp.bank_account_number,
                    transfer_title=rp.transfer_title or rp.name,
                )
                created += 1
            month += step
            while month > 12:
                month -= 12
                year += 1
    return created
