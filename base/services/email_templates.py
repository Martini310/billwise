"""Szablon powiadomienia e-mail o nowej fakturze (HTML + wersja tekstowa).

Konkretny, bez zbędnych uprzejmości: od kogo, ile, termin, link do panelu i eBOK.
"""

APP_URL = 'https://billwise-two.vercel.app'

# Dostawcy, dla których mamy logo w /assets/logos/ — reszta dostaje logo-inne.png,
# żeby w mailu nie pojawił się „złamany" obrazek.
_SUPPLIERS_WITH_LOGO = {'aquanet', 'enea', 'inea', 'orange', 'orlen', 'pgnig', 'plus'}

_FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
_INDIGO = '#6366F1'


def _format_amount(value):
    """1234.5 -> '1 234,50 zł' (format PL)."""
    try:
        s = f"{float(value):,.2f}"           # 1,234.50
    except (TypeError, ValueError):
        return '—'
    s = s.replace(',', ' ').replace('.', ',')  # 1 234,50 (spacja nierozdzielająca)
    return f"{s} zł"


def _format_date(value):
    try:
        return value.strftime('%d.%m.%Y')
    except AttributeError:
        return str(value) if value else '—'


def _logo_url(supplier_name):
    key = (supplier_name or 'inne').lower()
    if key not in _SUPPLIERS_WITH_LOGO:
        key = 'inne'
    return f"{APP_URL}/assets/logos/logo-{key}.png"


def _row(label, value):
    return (
        '<tr>'
        f'<td style="padding:11px 0 0;font:400 13px {_FONT};color:#8a8aa0;">{label}</td>'
        f'<td align="right" style="padding:11px 0 0;font:600 13px {_FONT};color:#1a1a2e;">{value}</td>'
        '</tr>'
    )


def render_new_invoice_html(*, supplier_name, amount, deadline, category, number, ebok_url=None):
    supplier = supplier_name or 'Inne'
    amount_str = _format_amount(amount)
    deadline_str = _format_date(deadline)
    logo = _logo_url(supplier)

    rows = (
        _row('Termin płatności', deadline_str)
        + _row('Kategoria', category or '—')
        + _row('Numer faktury', number or '—')
    )

    ebok = ''
    if ebok_url:
        ebok = (
            '<div style="padding-top:14px;text-align:center;">'
            f'<a href="{ebok_url}" style="font:500 13px {_FONT};color:{_INDIGO};'
            f'text-decoration:none;">Przejdź do eBOK {supplier} →</a></div>'
        )

    return f"""<!DOCTYPE html>
<html lang="pl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>Nowa faktura</title></head>
<body style="margin:0;padding:0;background:#f4f4f7;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f4f4f7;">{supplier}: {amount_str} · termin {deadline_str}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:480px;max-width:480px;">
<tr><td style="padding:0 4px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="vertical-align:middle;"><img src="{APP_URL}/favicon-32x32.png" width="24" height="24" alt="" style="display:block;border-radius:6px;"></td>
<td style="vertical-align:middle;padding-left:8px;font:700 18px {_FONT};color:{_INDIGO};letter-spacing:-.02em;">BillWise</td>
</tr></table>
</td></tr>
<tr><td style="background:#ffffff;border:1px solid #ececf2;border-radius:14px;padding:24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="vertical-align:middle;">
<div style="font:600 11px {_FONT};color:#8a8aa0;text-transform:uppercase;letter-spacing:.07em;">Nowa faktura</div>
<div style="font:700 20px {_FONT};color:#1a1a2e;padding-top:3px;">{supplier}</div>
</td>
<td align="right" style="vertical-align:middle;"><img src="{logo}" alt="{supplier}" height="26" style="display:block;max-height:26px;"></td>
</tr></table>
<div style="font:800 34px {_FONT};color:#111827;padding:18px 0 2px;letter-spacing:-.02em;">{amount_str}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:1px solid #f0f0f5;">{rows}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;"><tr>
<td align="center" style="border-radius:10px;background:{_INDIGO};">
<a href="{APP_URL}" style="display:block;padding:13px 24px;font:600 15px {_FONT};color:#ffffff;text-decoration:none;">Zobacz w BillWise →</a>
</td></tr></table>
{ebok}
</td></tr>
<tr><td style="padding:16px 8px;font:400 12px {_FONT};color:#9a9ab0;text-align:center;">Dostajesz tę wiadomość, bo śledzisz rachunki w BillWise.</td></tr>
</table>
</td></tr></table>
</body></html>"""


def render_new_invoice_text(*, supplier_name, amount, deadline, category, number, ebok_url=None):
    lines = [
        f"Nowa faktura — {supplier_name or 'Inne'}",
        f"Kwota: {_format_amount(amount)}",
        f"Termin płatności: {_format_date(deadline)}",
        f"Kategoria: {category or '—'}",
        f"Numer: {number or '—'}",
        "",
        f"Zobacz w BillWise: {APP_URL}",
    ]
    if ebok_url:
        lines.append(f"eBOK {supplier_name}: {ebok_url}")
    return "\n".join(lines)


def new_invoice_email(invoice):
    """Buduje (subject, text, html) dla powiadomienia o nowej fakturze."""
    supplier = getattr(getattr(invoice, 'account', None), 'supplier', None)
    supplier_name = supplier.name if supplier else 'Inne'
    ebok_url = getattr(supplier, 'url', None) if supplier else None
    category = invoice.category.name if getattr(invoice, 'category', None) else None

    fields = dict(
        supplier_name=supplier_name,
        amount=invoice.amount,
        deadline=invoice.pay_deadline,
        category=category,
        number=invoice.number,
        ebok_url=ebok_url,
    )
    subject = f"{supplier_name}: nowa faktura {_format_amount(invoice.amount)}"
    return subject, render_new_invoice_text(**fields), render_new_invoice_html(**fields)
