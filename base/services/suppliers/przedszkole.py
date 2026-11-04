"""Integracja z iPrzedszkole / iOpłatyedu (Progman, Wolters Kluwer).

Portal rodzica to klasyczna aplikacja ASP.NET (WebForms) z logowaniem przez
formularz z ViewState oraz usługami ASMX zwracającymi JSON. Dane należności
pobieramy z raportu rocznego (`pobierzDaneRaportRoczny`), który daje rozbicie
miesięczne na dany rok szkolny: dla każdego miesiąca kwotę do zapłaty, kwotę
zapłaconą i zaległość. Każdy miesiąc z niezerową należnością traktujemy jako
jedną fakturę.

Dane logowania (3 pola) mapujemy na pola konta:
  - login          -> użytkownik
  - password       -> hasło
  - device_token   -> nazwa jednostki (pole "Nazwa jednostki" w formularzu logowania)
"""
import re
from datetime import date

from requests.exceptions import RequestException

from ..decorators import supplier_log, logger
from ..class_services import SyncSupplier, FetchSupplier

__all__ = ['SyncPrzedszkole']


class SyncPrzedszkole(FetchSupplier, SyncSupplier):
    supplier_name = 'iPrzedszkole'

    BASE = 'https://iprzedszkole.progman.pl/iprzedszkole'
    LOGIN_URL = f'{BASE}/Authentication/Login.aspx'
    NALEZNOSCI_URL = f'{BASE}/Pages/PanelRodzica/Naleznosci/Naleznosci.aspx'
    RAPORT_URL = f'{BASE}/Pages/PanelRodzica/Naleznosci/ws_Naleznosci.asmx/pobierzDaneRaportRoczny'

    USER_AGENT = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36')

    # ---- logowanie (ASP.NET WebForms + ViewState) ---------------------------
    @staticmethod
    def _hidden(html, name):
        """Wyciąga wartość ukrytego pola formularza (np. __VIEWSTATE)."""
        pattern = r'(?:id|name)="%s"[^>]*\bvalue="([^"]*)"' % re.escape(name)
        m = re.search(pattern, html)
        return m.group(1) if m else ''

    @supplier_log(supplier_name)
    def login(self, session):
        session.headers.update({'User-Agent': self.USER_AGENT})
        try:
            page = session.get(self.LOGIN_URL, timeout=30)
            page.raise_for_status()
            html = page.text

            data = {
                '__VIEWSTATE': self._hidden(html, '__VIEWSTATE'),
                '__VIEWSTATEGENERATOR': self._hidden(html, '__VIEWSTATEGENERATOR'),
                '__EVENTVALIDATION': self._hidden(html, '__EVENTVALIDATION'),
                '__EVENTTARGET': '',
                '__EVENTARGUMENT': '',
                'ctl00$cphContent$txtDatabase': self.account.device_token or '',  # nazwa jednostki
                'ctl00$cphContent$txtLogin': self.account.login,
                'ctl00$cphContent$txtPassword': self.account.password,
                'ctl00$cphContent$ButtonLogin': 'Zaloguj',
            }
            session.post(self.LOGIN_URL, data=data, timeout=30, allow_redirects=True)

            # Potwierdzenie logowania + odczyt kontekstu (dziecko/rok szkolny).
            panel = session.get(self.NALEZNOSCI_URL, timeout=30)
            ptxt = panel.text
            rok = re.search(r'MasterCurrentRok\s*=\s*(\d+)', ptxt)
            if not rok:
                raise ValueError('Nie można się zalogować przy użyciu podanych danych')

            self.rok_start = int(rok.group(1))
            self.children = self._parse_children(ptxt)
            if not self.children:
                # awaryjnie: bieżące dziecko z nagłówka
                cur = re.search(r'MasterCurrentDzieckoId\s*=\s*(\d+)', ptxt)
                if cur:
                    self.children = [(int(cur.group(1)), '')]
            if not self.children:
                raise ValueError('Nie znaleziono dziecka przypisanego do konta')

            logger.info(f"[IPRZEDSZKOLE] Zalogowano; rok {self.rok_start}, dzieci: {len(self.children)}")

        except RequestException as exc:
            logger.warning(f"[IPRZEDSZKOLE] Błąd połączenia: {exc}")
            raise ValueError('Nie można się zalogować przy użyciu podanych danych') from exc

    @staticmethod
    def _parse_children(html):
        """Lista (dzieckoId, nazwa) z selektora osoby w nagłówku."""
        block = re.search(r'MasterComboDziecko".*?</select>', html, re.S)
        if not block:
            return []
        opts = re.findall(r'<option[^>]*value="(\d+)"[^>]*>([^<]*)</option>', block.group(0))
        return [(int(v), t.strip()) for v, t in opts]

    # ---- pobranie danych ----------------------------------------------------
    @supplier_log(supplier_name)
    def get_invoices(self, session):
        rows = []
        # Bieżący i poprzedni rok szkolny (trochę historii wstecz).
        years = [self.rok_start, self.rok_start - 1]
        for dziecko_id, name in self.children:
            for rok in years:
                try:
                    resp = session.post(
                        self.RAPORT_URL,
                        json={'args': {'dzieckoId': dziecko_id, 'rokStart': str(rok),
                                       'listViewName': 'Szczegoly'}},
                        headers={'Content-Type': 'application/json; charset=utf-8',
                                 'Accept': 'application/json'},
                        timeout=30,
                    )
                    resp.raise_for_status()
                    for row in resp.json().get('d', {}).get('ListData', []):
                        rows.append((dziecko_id, name, row))
                except (RequestException, ValueError) as exc:
                    logger.warning(f"[IPRZEDSZKOLE] Raport {dziecko_id}/{rok} nieudany: {exc}")
                    continue
        return rows

    # ---- parsowanie na faktury ----------------------------------------------
    @supplier_log(supplier_name)
    def parse_invoices(self, invoices):
        parsed = []
        for dziecko_id, name, row in invoices:
            rok = row.get('Rok') or 0
            miesiac = row.get('Miesiac') or 0
            do_zaplaty = float(row.get('DoZaplaty') or 0)
            # Pomijamy wiersze zbiorcze ("Wcześniejszy okres", "RAZEM") i miesiące bez naliczenia.
            if rok == 0 or miesiac == 0 or do_zaplaty <= 0:
                continue

            zaleglosc = float(row.get('Zaleglosc') or 0)
            due = date(rok, miesiac, 15)  # termin płatności zwykle do połowy miesiąca
            parsed.append({
                'number':              f"iPrzedszkole {dziecko_id} {rok}-{miesiac:02d}",
                'date':                date(rok, miesiac, 1),
                'amount':              do_zaplaty,
                'pay_deadline':        due,
                'start_date':          None,
                'end_date':            None,
                'amount_to_pay':       zaleglosc,
                'wear':                None,
                'user':                self.user,
                'is_paid':             zaleglosc <= 0.001,
                'consumption_point':   name or None,
                'account':             self.account,
                'category':            self.account.category,
                'bank_account_number': None,
                'transfer_title':      f"Przedszkole {row.get('Okres', '')}".strip(),
            })
        return parsed
