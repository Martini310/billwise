"""Generowanie faktur z cyklicznych opłat (czynsz, śmieci, kredyt itp.)."""
from datetime import date
from ..models import RecurringPayment, Invoice


def generate_recurring_invoices(user):
    """Tworzy brakujące faktury dla aktywnych opłat cyklicznych użytkownika —
    od start_date do bieżącego miesiąca, krokiem co ``interval_months``.
    Faktury powstają jako NIEzapłacone (użytkownik odhacza ręcznie).

    Dla opłat o zmiennej kwocie (``amount_variable``) kwota faktury jest tylko
    podpowiedzią: bierzemy ostatnią znaną kwotę tej opłaty (lub kwotę orientacyjną
    z definicji), a faktura dostaje ``estimated=True`` — użytkownik wpisuje realną
    kwotę, gdy przyjdzie rachunek."""
    today = date.today()
    created = 0
    for rp in RecurringPayment.objects.filter(user=user, active=True):
        # Podpowiedź kwoty dla trybu zmiennego: ostatnia faktura tej opłaty,
        # a jak jej nie ma — kwota orientacyjna z definicji.
        if rp.amount_variable:
            last = Invoice.objects.filter(recurring=rp).order_by('-date').first()
            seed = last.amount if last else (rp.amount or 0)
        else:
            seed = rp.amount or 0

        year, month = rp.start_date.year, rp.start_date.month
        step = max(1, rp.interval_months)
        while (year, month) <= (today.year, today.month):
            number = f"{rp.name} {year:04d}-{month:02d}"
            if not Invoice.objects.filter(number=number, user=user).exists():
                due = date(year, month, min(max(rp.day, 1), 28))
                Invoice.objects.create(
                    number=number,
                    date=due,
                    amount=seed,
                    pay_deadline=due,
                    amount_to_pay=seed,
                    user=user,
                    is_paid=False,
                    category=rp.category,
                    recurring=rp,
                    account=None,
                    estimated=rp.amount_variable,
                    bank_account_number=rp.bank_account_number,
                    transfer_title=rp.transfer_title or rp.name,
                )
                created += 1
            month += step
            while month > 12:
                month -= 12
                year += 1
    return created
