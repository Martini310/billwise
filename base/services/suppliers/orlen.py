import os
import re
import imaplib
import email
import pdfplumber
from datetime import datetime
from email.header import decode_header
from requests.exceptions import RequestException
from ..decorators import supplier_log, logger
from ..class_services import SyncSupplier, FetchSupplier

# from base.services.class_services import SyncSupplier, FetchSupplier

__all__ = ['SyncOrlen']

ATTACHMENTS_DIR = "attachments"
class SyncOrlen(FetchSupplier, SyncSupplier):
    """
    Fetches and parses Orlen invoices from email.
    """

    supplier_name = "Orlen"

    IMAP_SERVER = "imap.wp.pl"
    IMAP_PORT = 993
    SENDER_EMAIL = "orlenpay@orlen.pl"

    @supplier_log(supplier_name)
    def login(self, session=None):
        """Logs into the email account using IMAP."""
        try:
            logger.info(f"[{self.supplier_name}] Logging into email server...")

            self.mail = imaplib.IMAP4_SSL(self.IMAP_SERVER, self.IMAP_PORT)
            self.mail.login(self.account.login, self.account.password)

            logger.info("Successfully logged in to the email server.")
        except imaplib.IMAP4.error as e:
            logger.error(f"IMAP login failed: {e}")
            raise ValueError(f"Błąd logowania: {e}")
        except Exception as e:
            logger.error(f"Login failed: {e}")
            raise ValueError(f"Login failed: {e}")

    @supplier_log(supplier_name)
    def get_invoices(self, session=None):
        """Fetches invoices from Orlen emails."""
        if not self.mail:
            logger.error("No email connection. Cannot fetch invoices.")
            return dict()

        try:
            # Select the inbox
            self.mail.select("inbox")

            # Search for emails from Orlen
            status, data = self.mail.search(None, 'FROM', f'"{self.SENDER_EMAIL}"')
            if status != "OK":
                logger.warning("No emails found from Orlen.")
                return dict()

            email_ids = data[0].split()
            logger.info(f"Found {len(email_ids)} emails from {self.SENDER_EMAIL}.")

            for email_id in email_ids:
                try:
                    status, msg_data = self.mail.fetch(email_id, "(RFC822)")
                    if status != "OK":
                        logger.warning(f"Failed to fetch email ID: {email_id}")
                        continue

                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)
                    sender = email.utils.parseaddr(msg.get("From"))[1]

                    if sender.lower() != self.SENDER_EMAIL:
                        continue

                    self.download_attachments(msg)
                except Exception as e:
                    logger.error(f"Error processing email {email_id}: {e}")
                    continue

        except Exception as e:
            logger.error(f"Failed to fetch emails: {e}")

        finally:
            self.mail.logout()
            logger.info("Disconnected from email server.")

        return dict()

    def download_attachments(self, msg):
        """Download invoice attachments from the email."""
        for part in msg.walk():
            if part.get_content_maintype() == "multipart":
                continue

            filename = part.get_filename()
            if filename:
                filename = self.sanitize_filename(self.clean_filename(filename))
                if "faktura" not in filename.lower():
                    continue

                filepath = os.path.join(ATTACHMENTS_DIR, filename)
                os.makedirs(ATTACHMENTS_DIR, exist_ok=True)

                with open(filepath, "wb") as f:
                    f.write(part.get_payload(decode=True))
                logger.info(f"Attachment saved: {filepath}")

    def parse_invoices(self, dict):
        """Parses invoice details from an Orlen invoice PDF."""
        invoices = []
        for filename in os.listdir(ATTACHMENTS_DIR):
            if filename.lower().endswith(".pdf"):
                pdf_path = os.path.join(ATTACHMENTS_DIR, filename)

                data = {
                    "number":        None,
                    "date":          None,
                    "pay_deadline":  None,
                    "amount":        None,
                    "amount_to_pay": None,
                    "wear":          None,
                    "is_paid":       True,
                    'account':       self.account,
                    'category':      self.account.category,
                    'user':          self.user
                }

                try:
                    with pdfplumber.open(pdf_path) as pdf:
                        text = "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())

                    # Extract invoice number (e.g., "F 107K19/1147/25")
                    data["number"] = self.extract_value(text, r'F\s\w{4,8}/\d{2,5}/\d{2}')

                    # Extract issue date (Format: YYYY-MM-DD)
                    date_str = self.extract_value(text, r'\d{4}-\d{2}-\d{2}')
                    if date_str:
                        data["date"] = datetime.strptime(date_str, "%Y-%m-%d").strftime("%Y-%m-%d")
                        data["pay_deadline"] = data["date"]

                    # Extract gross amount (e.g., "100,99 PLN")
                    data["amount"] = self.extract_value(text, r'(\d{1,},\d{2})\s?PLN', True)
                    data["amount_to_pay"] = data["amount"]

                    # Extract quantity (liters, e.g., "15,320")
                    data["wear"] = self.extract_value(text, r'(\d{1,3},\d{3})', True)

                    if data["wear"] and data["amount"]:
                        data["price"] = round(float(data["amount"]) / float(data["wear"]), 2)

                    invoices.append(data)
                    logger.info(f"Extracted data: {data}")

                except Exception as e:
                    logger.error(f"Failed to process PDF {filename}: {e}")
                    continue

        self.clear_attachments()
        return invoices


    @staticmethod
    def extract_value(text, pattern, convert_float=False):
        """Helper function to extract values using regex."""
        match = re.search(pattern, text)
        if match:
            value = match.group(1) if convert_float else match.group()
            return value.replace(',', '.') if convert_float else value
        return None
    
    @staticmethod
    def clean_filename(filename):
        """Decode filename from email encoding."""
        decoded = decode_header(filename)
        return "".join(part.decode(encoding or "utf-8") if isinstance(part, bytes) else part for part, encoding in decoded)


    @staticmethod
    def sanitize_filename(filename):
        """Replace invalid filename characters."""
        return re.sub(r'[\/:*?"<>|]', "_", filename.strip().lower())

    def clear_attachments(self):
        for filename in os.listdir(ATTACHMENTS_DIR):
            if filename.lower().endswith(".pdf"):
                os.remove(os.path.join(ATTACHMENTS_DIR, filename))
