# BillWise — audyt integracji synchronizacji (2026-11-02)

Raport z badania stanu synchronizacji dostawców. Zakres: Orlen (dawniej PGNiG),
Enea, Aquanet, Orange, Plus, Inea.

## Jak to dziś działa (architektura)

- Każdy dostawca to klasa w `base/services/suppliers/*.py` dziedzicząca po
  `FetchSupplier` + `SyncSupplier` (`base/services/class_services.py`), z metodami
  `login` / `get_invoices` / `parse_invoices`.
- Klasy są auto-rejestrowane po `supplier_name` w `base/tasks.py` i uruchamiane
  przez Celery task `synchronize_data` (po `Account.supplier.name` z bazy).
- Dane dostępowe trzymane są w modelu `Account` (`base/models.py`) — pola `login`
  i `password` **plain text** w bazie. Edycja przez panel admina Django.
- Jeśli `Account.notification` jest ustawione (błąd), konto jest pomijane przy
  kolejnych synchronizacjach aż do wyczyszczenia pola.

### Co jest w bazie (`db.sqlite3`, user `aaa` / id 1)

| id | Dostawca | login | hasło | stan |
|----|----------|-------|-------|------|
| 1 | Orlen | `martin310@wp.pll` ⚠️ literówka (podwójne `l`) | jest | błąd logowania IMAP |
| 2 | Aquanet | `paulajak@wp.pl` | jest | login OK, blokuje 2FA (TOTP) |

Dostawcy zarejestrowani w bazie: PGNiG, Enea, Aquanet, Orlen. **Brak kont** dla
PGNiG/Enea oraz brak jakichkolwiek wpisów dla Orange, Plus, Inea.

---

## Stan per dostawca

### 🔴 Orlen (e-mail/IMAP, dawniej osobny ebok)
- **Mechanizm:** `orlen.py` NIE loguje się do portalu Orlen — pobiera faktury PDF
  z maila (`imap.wp.pl`), filtrując wiadomości od `orlenpay@orlen.pl`, i parsuje
  kwoty regexem z PDF (`pdfplumber`).
- **Dlaczego nie działa:** błąd w bazie to
  `Logowanie nie powiodło się… aktywuj dostęp przez IMAP`. Dwie przyczyny:
  1. **Literówka w loginie**: `martin310@wp.pll` (powinno być `wp.pl`).
  2. **wp.pl wymaga włączenia dostępu IMAP + hasła aplikacji** (osobne hasło do
     IMAP, nie hasło do konta WWW). To jest odpowiednik 2FA dla poczty.
- **Parser jest kruchy:** `wear` (litry) wyłapywane losowym regexem `\d,\d{3}`,
  numer faktury sztywnym wzorcem `F \w{4,8}/…`. Do przeglądu po naprawie logowania.

### 🔴 PGNiG → zmigrowane do Orlen (`ebok.myorlen.pl`)
- **Mechanizm:** `pgnig.py` loguje się POST-em do `ebok.pgnig.pl/auth/login` i
  czyta `/crm/get-invoices-v2` (API tokenowe, `AuthToken` w nagłówku).
- **Co się zmieniło:** `ebok.pgnig.pl` **przekierowuje na `ebok.myorlen.pl`**.
  API nadal istnieje (`/auth/login?api-version=3.0` odpowiada 401 z poprawną
  strukturą, obsługuje `api-version` 1.0/2.0/3.0) — czyli integrację da się
  wskrzesić, zmieniając bazowy host na `ebok.myorlen.pl` i dostarczając dane
  logowania do eBOK Orlen (identyfikator + PIN).
- **Uwaga:** to jest realny „Orlen” z zakresu zadania (portal gazowy/prądowy),
  odrębny od maila `orlenpay` powyżej. Warto zdecydować, które źródło chcesz.

### 🟡 Aquanet — login działa, blokuje 2FA
- **Mechanizm:** `aquanet.py` POST `/api/login` (JSON), potem GraphQL
  `/api/graphql`. Stare błędy z logów (`Invalid isoformat`, `integer required`)
  wynikały z parsowania timestampów — w obecnym kodzie `datetime.fromtimestamp`
  jest już poprawione.
- **Realny blocker (potwierdzone na żywo):** po POST `/api/login` serwer zwraca
  ```json
  {"status": false, "2fa_path": "/auth/2fa_check", "2fa_method": "TOTP_APPLICATION", "2fa_next_resend_at": null}
  ```
  a GraphQL odrzuca zapytanie: `iam.user.two_factor_authentication_required`.
  Czyli: **konto Aquanet ma włączone 2FA typu TOTP** (aplikacja authenticator).
  Logowanie samym hasłem już nie wystarcza.
- **Drobne:** `amount_to_pay` ustawiane na saldo konta (`balance`) dla każdej
  faktury — to pole bywa `None` (przy 2FA) i wymaga przemyślenia modelu danych.

### 🔴 Enea — portal przeszedł na logowanie OIDC
- **Mechanizm:** `enea.py` GET strony logowania, wyciąga ukryty token z formularza,
  POST login, scrapuje HTML faktur (BeautifulSoup).
- **Co się zmieniło:** `ebok.enea.pl/logowanie` **przekierowuje na
  `moja.enea.pl` z przepływem OpenID Connect** (`client_id=asseco_ebok`,
  `redirect_uri=…/signin-oidc`, `scope=openid profile phone`). Stary scraping
  tokenu z formularza i prosty POST **nie zadziałają** — trzeba przejść pełny
  flow OIDC (authorize → login → callback z kodem → wymiana na sesję). Brak konta
  w bazie, więc nie dało się przetestować na żywo.

### ⚪ Orange — brak integracji
- Portal: `orange.pl/twojekonto` (po `/zaloguj` ląduje na `/twojekonto/`).
  Logowanie Orange ma własny SSO (Flow/`login.orange.pl`), zwykle z 2FA/SMS.
  Do napisania od zera.

### ⚪ Plus — brak integracji
- Portal to **iPlus** (`iplus.plus.pl`, aplikacja Next.js/SPA) — nie „ibok.plus.pl”
  (ta domena nie istnieje). Logowanie: numer telefonu + eHasło/Plus Kod. Dostęp
  do faktur daje tylko eHasło. Do napisania od zera; prawdopodobnie API pod SPA.

### ⚪ Inea — brak integracji, portal zmieniony
- Nowy portal to **`moja.inea.pl`** (Laravel/Livewire), stary `ebok.inea.pl` nie
  działa (cert `frontend-preprod.inea.com.pl` wygasły 2025-07, 301 w pętli).
  Do napisania od zera pod `moja.inea.pl`.

---

## Problem 2FA — jak „dostarczyć co trzeba” (bez obchodzenia zabezpieczeń)

Nie da się i nie należy „obchodzić” 2FA. Da się za to **dostarczyć kod legalnie**.
Trzy typy 2FA, trzy strategie:

### 1. TOTP (Aquanet — `TOTP_APPLICATION`) — w pełni automatyzowalne
TOTP to kod generowany z **sekretu współdzielonego**, który dostajesz raz przy
włączaniu authenticatora (QR / ciąg base32). Jeśli ten sekret zapiszesz w BillWise,
aplikacja sama wygeneruje 6-cyfrowy kod przy każdej synchronizacji — to nie jest
bypass, to ten sam mechanizm co Google Authenticator, tylko po stronie serwera.
- Dodać pole `totp_secret` do `Account`, uzupełnić `login()` o POST na
  `/auth/2fa_check` z kodem z `pyotp.TOTP(secret).now()`.
- Zależność: `pyotp` (do dodania w `requirements.txt`).
- **Uwaga bezpieczeństwa:** sekret TOTP + hasło w plain-text w bazie to realne
  ryzyko. Rekomendacja: szyfrować wrażliwe pola (np. `django-fernet-fields` lub
  własny wrapper na `cryptography`, który już jest w zależnościach).

### 2. OTP przez SMS/e-mail (Orange, czasem Plus) — półautomatyczne
Kodu nie da się wygenerować offline; trzeba go odebrać i wprowadzić. Wzorzec:
sync wykrywa żądanie 2FA → zapisuje stan „oczekuje na kod” + powiadamia Cię
(e-mail/push) → Ty wklejasz kod w UI → endpoint dokańcza logowanie i wznawia
pobieranie. Wymaga: modelu stanu sesji 2FA + prostego formularza we froncie +
endpointu „submit OTP”. Celery zamiast jednego taska robi dwa etapy.

### 3. Hasło aplikacji / dostęp IMAP (Orlen-mail) — konfiguracja jednorazowa
wp.pl pozwala wygenerować **osobne hasło do IMAP** i włączyć dostęp w ustawieniach
poczty. To wpisujesz jako `password` konta Orlen (zamiast hasła WWW). Analogicznie
Gmail = hasło aplikacji. To nie 2FA w kodzie, tylko poprawna konfiguracja źródła.

---

## Gdzie wpisać dane dostępowe

Konta są już w bazie — edycja w panelu admina: `http://localhost:8000/admin/`
→ **Base › Accounts**. Dla nowych dostawców trzeba najpierw dodać wiersz w
**Base › Suppliers**, potem **Account** (login, password, user, category).

Jeśli wolisz wpisać dane raz w pliku zamiast klikać w adminie, przygotuję
`secrets.local.env` + prosty management command, który zaseeduje `Supplier`/
`Account`. Daj znać — na razie nic takiego nie istnieje. **Nie commituj** danych
dostępowych; `.env` jest już w `.gitignore`.

---

## Rekomendowana kolejność prac

1. **Aquanet** — najbliżej działania. Dodać obsługę TOTP (`totp_secret` + `pyotp`
   + `/auth/2fa_check`). Potrzebny sekret TOTP z Twojej aplikacji authenticator.
2. **Orlen-mail** — poprawić login (`wp.pll`→`wp.pl`), włączyć IMAP + hasło
   aplikacji w wp.pl, przejrzeć kruchy parser PDF.
3. **PGNiG/Orlen-ebok** — przełączyć host na `ebok.myorlen.pl`, podać dane eBOK;
   zdecydować czy to zastępuje źródło mailowe.
4. **Enea** — przepisać `login()` na pełny flow OIDC (`moja.enea.pl`).
5. **Inea** (`moja.inea.pl`), **Plus** (`iplus.plus.pl`), **Orange**
   (`orange.pl/twojekonto`) — nowe integracje od zera (reverse-engineering API
   pod SPA + obsługa ich 2FA wg strategii wyżej).

### Przekrojowe usprawnienia
- Szyfrowanie `password`/`totp_secret` w bazie.
- Model stanu sesji 2FA + UI do wprowadzania kodu (dla SMS/e-mail OTP).
- `send_email_notification` ma błędny adres nadawcy `brzoza3102gmail.com` (brak `@`).
- Pliki `*-test.py` zawierają **prawdziwe dane logowania w kodzie** — usunąć/wyczyścić.
