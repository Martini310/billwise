"""
Jednorazowa konfiguracja sesji Plus (iPlus) z danych przechwyconych z aplikacji
mobilnej. Zapisuje refresh_token + device-id + billAccountCode na koncie, dzięki
czemu kolejne synchronizacje logują się bez hasła i bez SMS.

    python manage.py setup_plus <account_id> \
        --refresh-token ory_rt_... \
        --device-id 6d2de5de-9397-4df9-ad1a-66bb19ddc0b8 \
        --bill-account 24797181

Bez opcji wartości zostaną zapytane interaktywnie.
"""
import json
from django.core.management.base import BaseCommand, CommandError
from base.models import Account


class Command(BaseCommand):
    help = 'Zapisuje sesję Plus (refresh_token + device-id + billAccountCode) na koncie.'

    def add_arguments(self, parser):
        parser.add_argument('account_id', type=int, help='ID konta Plus (Base › Accounts)')
        parser.add_argument('--refresh-token', dest='refresh_token')
        parser.add_argument('--device-id', dest='device_id')
        parser.add_argument('--bill-account', dest='bill_account')

    def handle(self, *args, **options):
        try:
            account = Account.objects.get(pk=options['account_id'], supplier__name='Plus')
        except Account.DoesNotExist:
            raise CommandError('Nie znaleziono konta Plus o tym ID.')

        refresh = options['refresh_token'] or input('refresh_token (ory_rt_...): ').strip()
        device = options['device_id'] or input('device-id (UUID z nagłówka aplikacji): ').strip()
        bill = options['bill_account'] or input('billAccountCode (np. 24797181): ').strip()

        if not refresh:
            raise CommandError('refresh_token jest wymagany.')

        account.device_token = json.dumps({
            'refresh_token': refresh,
            'device_id': device,
            'bill_account': bill,
        })
        account.notification = None
        account.save(update_fields=['device_token', 'notification'])
        self.stdout.write(self.style.SUCCESS(
            'Sesja Plus zapisana. Uruchom synchronizację konta.'
        ))
