from datetime import datetime
from requests.exceptions import RequestException
from .decorators import supplier_log, logger


PGNIG_LOGIN_URL = "https://ebok.pgnig.pl/auth/login"
PGNIG_INVOICES_URL = "https://ebok.pgnig.pl/crm/get-invoices-v2"
PGNIG_API_VERSION = "3.0"
PGNIG_HEADERS = {
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'Host': 'ebok.pgnig.pl',
    'Origin': 'https://ebok.pgnig.pl',
    'Referer': 'https://ebok.pgnig.pl/',
    'Content-Type': 'application/x-www-form-urlencoded',
}

@supplier_log('PGNIG')
def login_to_pgnig(account, session):
    try:
        response = session.post(
            url=PGNIG_LOGIN_URL,
            data={
                'identificator': account.login,
                'accessPin': account.password,
                'DeviceId': '824e02bc5b8ac6100b807f6fc6184abf',
                'DeviceType': 'Web'
            },
            params={'api-version': PGNIG_API_VERSION},
            headers=PGNIG_HEADERS,
            verify=False,
            timeout=5000,
        )

        response.raise_for_status()
        logger.info("[PGNIG] Fetched token")
        token = response.json().get('Token')
        session.headers.update({'AuthToken': token})
    except RequestException as exc:
        logger.error(f"[PGNIG] Request exception occurred: {exc}")
        raise ValueError('Nie można się zalogować przy użyciu podanych danych') from exc


@supplier_log('PGNIG')
def get_pgnig_addresses(session):
    get_entry_points = session.get('https://ebok.pgnig.pl/crm/get-ppg-list?api-version=3.0')
    ppg_list = get_entry_points.json().get('PpgList')
    addresses = dict()
    for ppg in ppg_list:
        ppg_number = ppg.get('IdLocal')
        address = ppg.get('Address')
        addresses[ppg_number] = f"{address.get('Ulica')} {address.get('NrBudynku')}/{address.get('NrLokalu')}, {address.get('KodPocztowy')} {address.get('Miejscowosc')}"
    return addresses


@supplier_log('PGNIG')
def get_pgnig_invoices(session):
    # GET invoices on account - amount declared in 'pageSize'
    get_invoices = session.get(
        url=PGNIG_INVOICES_URL,
        params={
            'pageNumber': 1,
            'api-version': PGNIG_API_VERSION,
            'pageSize': 100,
        }
    )
    invoices = get_invoices.json()['InvoicesList']
    addresses = get_pgnig_addresses(session)
    return {'invoices': invoices, 'addresses': addresses}


@supplier_log('PGNIG')
def parse_pgnig_invoices(invoices, user, account):
    return [{'number':            invoice.get('Number'),
            'date':               datetime.fromisoformat(invoice.get('Date')[:-1]),
            'amount':             invoice.get('GrossAmount'),
            'pay_deadline':       datetime.fromisoformat(invoice.get('PayingDeadlineDate')[:-1]),
            'start_date':         datetime.fromisoformat(invoice.get('StartDate')[:-1]),
            'end_date':           datetime.fromisoformat(invoice.get('EndDate')[:-1]),
            'amount_to_pay':      invoice.get('AmountToPay'),
            'wear':               invoice.get('WearKWH'),
            'user':               user,
            'is_paid':            invoice.get('IsPaid'),
            'consumption_point':  invoices.get('addresses').get(invoice.get('IdPP')),
            'account':            account,
            'category':           account.category,
            'bank_account_number':invoice.get('Iban'),
            'transfer_title':     invoice.get('Number')}
        for invoice in invoices.get('invoices')]
