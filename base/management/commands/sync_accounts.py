"""Ręczny sync faktur dla wybranych kont.

Przydatne, gdy jakiś dostawca musi być synchronizowany z innego miejsca niż
regularny sync (np. Plus — jego API danych odrzuca IP serwera/datacenter, więc
odpalasz go z domowego, residential IP, pisząc do tej samej bazy).

    python manage.py sync_accounts --supplier Plus
    python manage.py sync_accounts --supplier Plus --user martin
    python manage.py sync_accounts            # wszystkie konta, wszyscy

W odróżnieniu od regularnego synca ta komenda NIE honoruje SYNC_SKIP_SUPPLIERS —
jeśli o coś poprosisz jawnie, zostanie to zsynchronizowane.
"""
from django.core.management.base import BaseCommand, CommandError
from base.models import Account
from base.tasks import fetch_data_classes


class Command(BaseCommand):
    help = "Synchronizuje faktury dla wybranych kont (filtry: --supplier, --user)."

    def add_arguments(self, parser):
        parser.add_argument('--supplier', help='Nazwa dostawcy, np. Plus (bez tego: wszyscy).')
        parser.add_argument('--user', help='Username lub ID użytkownika (bez tego: wszyscy).')

    def handle(self, *args, **options):
        qs = Account.objects.all()
        if options.get('supplier'):
            qs = qs.filter(supplier__name__iexact=options['supplier'])
        if options.get('user'):
            u = options['user']
            qs = qs.filter(user__pk=u) if str(u).isdigit() else qs.filter(user__username=u)
        if not qs.exists():
            raise CommandError('Brak kont pasujących do filtrów.')

        ok = fail = 0
        for account in qs.select_related('supplier', 'user'):
            SupplierClass = fetch_data_classes.get(account.supplier.name)
            if not SupplierClass:
                self.stdout.write(f"- {account.supplier.name} ({account.user.username}): brak integracji, pomijam")
                continue
            try:
                SupplierClass(account.user.id, account.pk).sync_data()
                # Odśwież instancję — SupplierClass mógł zrotować device_token (Plus) —
                # i wyczyść ewentualny komunikat błędu z poprzedniego razu.
                account.refresh_from_db()
                if account.notification:
                    account.notification = None
                    account.save(update_fields=['notification'])
                ok += 1
                self.stdout.write(self.style.SUCCESS(f"✓ {account.supplier.name} ({account.user.username})"))
            except ValueError as e:
                account.notification = str(e)
                account.save(update_fields=['notification'])
                fail += 1
                self.stdout.write(self.style.ERROR(f"✗ {account.supplier.name} ({account.user.username}): {e}"))
            except Exception as e:  # noqa: BLE001 — chcemy jechać dalej mimo błędu jednego konta
                fail += 1
                self.stdout.write(self.style.ERROR(f"✗ {account.supplier.name} ({account.user.username}): {e}"))

        self.stdout.write(self.style.NOTICE(f"Gotowe: {ok} ok, {fail} błędów."))
