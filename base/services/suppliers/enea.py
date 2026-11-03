import re
import imaplib
import email
from datetime import datetime, date
from email.utils import parseaddr, parsedate_to_datetime
from bs4 import BeautifulSoup
from ..decorators import supplier_log, logger
from ..class_services import SyncSupplier, FetchSupplier

__all__ = ['SyncEnea']


class SyncEnea(FetchSupplier, SyncSupplier):
    """
    Fetches Enea electricity invoices from the e-invoice notification emails.

    The Enea web portal (moja.enea.pl) sits behind reCAPTCHA Enterprise + F5/Shape
    bot defence, and the Moja Enea mobile app talks over HTTP/3 (QUIC) which a TCP
    proxy cannot capture — so neither is scriptable. Enea does email a plain
    notification for every issued invoice, from powiadomienia@ebok.enea.pl, with
    the invoice number, amount and due date in the body (no PDF attached). We read
    those over IMAP and parse the text, the same email route used for Orlen.

    The notification carries no payment status, so a bill is treated as paid once
    its due date has passed — good enough for on-time payers, and it keeps the
    current (not yet due) bill correctly flagged as unpaid.
    """

    supplier_name = 'Enea'
    IMAP_SERVER = 'imap.wp.pl'
    IMAP_PORT = 993
    SENDER_EMAIL = 'powiadomienia@ebok.enea.pl'

    NUMBER_RE = re.compile(r'(P/\d+/\d+/\d+)')
    AMOUNT_RE = re.compile(r'wynosi\s+([\d ]+,\d{2})\s*z', re.I)
    DEADLINE_RE = re.compile(r'do dnia\s+(\d{2}\.\d{2}\.\d{4})', re.I)

    @supplier_log(supplier_name)
    def login(self, session=None):
        try:
            self.mail = imaplib.IMAP4_SSL(self.IMAP_SERVER, self.IMAP_PORT)
            self.mail.login(self.account.login, self.account.password)
            logger.info('[ENEA] Logged into mailbox')
        except imaplib.IMAP4.error as e:
            logger.error(f'[ENEA] IMAP login failed: {e}')
            raise ValueError(f'Błąd logowania do poczty Enea: {e}')

    @supplier_log(supplier_name)
    def get_invoices(self, session=None):
        messages = []
        try:
            self.mail.select('inbox')
            status, data = self.mail.search(None, 'FROM', f'"{self.SENDER_EMAIL}"')
            if status != 'OK' or not data[0]:
                logger.warning('[ENEA] No notification emails found.')
                return {'messages': messages}

            email_ids = data[0].split()
            logger.info(f'[ENEA] Found {len(email_ids)} emails from {self.SENDER_EMAIL}.')
            for email_id in email_ids:
                status, msg_data = self.mail.fetch(email_id, '(RFC822)')
                if status != 'OK':
                    continue
                msg = email.message_from_bytes(msg_data[0][1])
                if parseaddr(msg.get('From'))[1].lower() != self.SENDER_EMAIL:
                    continue
                messages.append({'date': msg.get('Date'), 'body': self._body(msg)})
        finally:
            self.mail.logout()
            logger.info('[ENEA] Disconnected from mailbox.')
        return {'messages': messages}

    @staticmethod
    def _body(msg):
        """Return the message body as plain text (prefer text/plain, else strip HTML)."""
        text, html = '', ''
        for part in msg.walk():
            if part.get_filename() or part.get_content_maintype() == 'multipart':
                continue
            charset = part.get_content_charset() or 'utf-8'
            if part.get_content_type() == 'text/plain':
                text += part.get_payload(decode=True).decode(charset, 'replace')
            elif part.get_content_type() == 'text/html':
                html += part.get_payload(decode=True).decode(charset, 'replace')
        if text.strip():
            return text
        return BeautifulSoup(html, 'html.parser').get_text(' ', strip=True) if html else ''

    @supplier_log(supplier_name)
    def parse_invoices(self, invoices):
        today = date.today()
        invoice_objects = []
        seen = set()
        for message in invoices.get('messages', []):
            body = re.sub(r'\s+', ' ', message.get('body') or '')
            number_match = self.NUMBER_RE.search(body)
            amount_match = self.AMOUNT_RE.search(body)
            deadline_match = self.DEADLINE_RE.search(body)
            if not (number_match and amount_match and deadline_match):
                continue

            number = number_match.group(1)
            if number in seen:
                continue
            seen.add(number)

            try:
                amount = float(amount_match.group(1).replace(' ', '').replace(',', '.'))
                deadline = datetime.strptime(deadline_match.group(1), '%d.%m.%Y').date()
            except ValueError as e:
                logger.error(f'[ENEA] Error parsing invoice {number}: {e}')
                continue

            issued = self._issued_date(message.get('date')) or deadline
            is_paid = deadline < today
            invoice_objects.append({
                'number':         number,
                'date':           issued,
                'amount':         amount,
                'pay_deadline':   deadline,
                'amount_to_pay':  0.0 if is_paid else amount,
                'user':           self.user,
                'is_paid':        is_paid,
                'account':        self.account,
                'category':       self.account.category,
                'transfer_title': number,
            })
        return invoice_objects

    @staticmethod
    def _issued_date(raw):
        try:
            return parsedate_to_datetime(raw).date()
        except (TypeError, ValueError):
            return None
