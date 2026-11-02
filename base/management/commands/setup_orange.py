"""
Jednorazowa konfiguracja zaufanego urządzenia Orange.

Uruchom logowanie z kodem SMS i zapisz token AUTH_DEVICE_TOKEN na koncie, dzięki
czemu kolejne synchronizacje logują się bez SMS.

    python manage.py setup_orange <account_id>
"""
import requests
import urllib3
from django.core.management.base import BaseCommand, CommandError
from base.models import Account
from base.services.suppliers.orange import SyncOrange

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class Command(BaseCommand):
    help = "Rejestruje zaufane urządzenie Orange (logowanie z kodem SMS) i zapisuje device_token."

    def add_arguments(self, parser):
        parser.add_argument('account_id', type=int, help='ID konta Orange (Base › Accounts)')

    def handle(self, *args, **options):
        try:
            account = Account.objects.get(pk=options['account_id'], supplier__name='Orange')
        except Account.DoesNotExist:
            raise CommandError('Nie znaleziono konta Orange o tym ID.')

        base = SyncOrange.LOGIN_BASE
        hdr = {'Origin': SyncOrange.ORIGIN, 'Referer': f'{base}/zaloguj'}
        s = requests.Session()
        s.headers.update({'User-Agent': SyncOrange.USER_AGENT, 'Accept': 'application/json'})

        s.get(f'{base}/zaloguj', verify=False, timeout=30)
        s.get(f'{base}/session/check', verify=False, timeout=30)
        init = s.post(f'{base}/login/init', json={'login': account.login},
                      headers=hdr, verify=False, timeout=30).json()
        if not init.get('executionId'):
            raise CommandError('Nie udało się rozpocząć logowania (CSRF/sesja).')

        pw = s.post(f'{base}/login/action',
                    json={'action': 'LOGIN_2FA_PASSWORD', 'executionId': init['executionId'],
                          'state': init['state'], 'login': account.login, 'password': account.password},
                    headers=hdr, verify=False, timeout=30).json()
        action = pw.get('requireAction')

        if action == 'COMPLETED' and s.cookies.get('AUTH_DEVICE_TOKEN'):
            account.device_token = s.cookies.get('AUTH_DEVICE_TOKEN')
            account.save(update_fields=['device_token'])
            self.stdout.write(self.style.SUCCESS('Zalogowano bez SMS — token już zaufany, zapisano.'))
            return
        if action not in ('LOGIN_2FA_SMS', 'LOGIN_2FA_SMS_RETRY'):
            raise CommandError(f'Nieoczekiwany wynik logowania: {action or pw.get("message")}')

        # executionId rotuje po kroku hasła — użyj tego z odpowiedzi.
        exec_id = pw.get('executionId', init['executionId'])
        state = pw.get('state', init['state'])
        code = input('Podaj kod SMS z Orange: ').strip()

        otp = s.post(f'{base}/login/action',
                     json={'action': 'LOGIN_2FA_SMS', 'executionId': exec_id, 'state': state, 'otp': code},
                     headers=hdr, verify=False, timeout=30).json()
        if otp.get('requireAction') != 'COMPLETED' or not otp.get('deviceToken'):
            raise CommandError(f'Logowanie SMS nie powiodło się: {otp.get("message") or otp}')

        # Rejestracja zaufanego urządzenia (ADD_DEVICE -> /login/completed).
        s.post(f'{base}/login/completed',
               json={'action': 'ADD_DEVICE', 'state': state,
                     'authenticationId': otp['authenticationId'], 'deviceToken': otp['deviceToken']},
               headers={'Origin': SyncOrange.ORIGIN}, verify=False, timeout=30)

        token = s.cookies.get('AUTH_DEVICE_TOKEN')
        if not token:
            raise CommandError('Brak AUTH_DEVICE_TOKEN po rejestracji urządzenia.')
        account.device_token = token
        account.notification = None
        account.save(update_fields=['device_token', 'notification'])
        self.stdout.write(self.style.SUCCESS('Zaufane urządzenie zarejestrowane, token zapisany. Kolejne synchronizacje bez SMS.'))
