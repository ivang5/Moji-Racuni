"""
Deterministički test/dev podaci (seed) za ručno testiranje i smoke testove.

    python manage.py seed_dev_data                 # napravi ono što nedostaje (idempotentno)
    python manage.py seed_dev_data --reset         # obriši SAMO seed podatke, pa ih napravi ponovo
    python manage.py seed_dev_data --delete-only   # samo obriši seed podatke
    python manage.py seed_dev_data --anchor-date 2026-01-15   # datumi računa računaju se unazad od ovog dana

Radi samo kada je DEBUG=True. Seed podaci su jasno obeleženi:
- korisnici qa_admin, qa_regular, qa_regular_2..4 (email @seed.example.com),
- preduzeća sa PIB-om 900000001-900000010 i nazivom "[SEED] ...",
- linkovi računa https://suf.purs.gov.rs/v/?vl=SEED-<korisnik>-<broj>.
Lozinka svih seed naloga: env SEED_PASSWORD ili podrazumevana (ispisuje se na kraju).

Generisanje koristi fiksni RNG seed, pa je skup isti pri svakom pokretanju; od --anchor-date
(podrazumevano današnji dan) zavise samo datumi (račun "pre N dana" ostaje "pre N dana").
"""
import os
import random
from datetime import date, datetime, timedelta, timezone as dt_timezone
from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.utils import timezone

from account.models import User
from company.models import Company, CompanyType, CompanyUnit
from receipt.models import Item, Receipt, Report

RNG_SEED = 20261124
LINK_PREFIX = "https://suf.purs.gov.rs/v/?vl=SEED-"
COMPANY_PREFIX = "[SEED] "
EMAIL_DOMAIN = "seed.example.com"
PASSWORD_ENV = "SEED_PASSWORD"
DEFAULT_PASSWORD = "QaLozinka-2026"

ADMIN_USERNAME = "qa_admin"
#* korisnik: (broj sopstvenih računa, aktivan)
REGULAR_USERS = {
    "qa_regular": (60, True),
    "qa_regular_2": (25, True),
    "qa_regular_3": (15, True),
    "qa_regular_4": (5, False),
}
SEED_USERNAMES = [ADMIN_USERNAME, *REGULAR_USERS]
#* Računi korisnika qa_regular (po indeksu) koje je uneo i qa_regular_2, sa istim linkom (ADMIN deduplikacija)
SHARED_RECEIPT_INDEXES = [2, 9, 16, 23, 30]
#* Prvih N računa svakog korisnika pada u tekući mesec (da početna strana ima podatke za "ovaj mesec")
CURRENT_MONTH_RECEIPTS = 4
HISTORY_DAYS = 425

UNIT_CATEGORY = "Promet\nProdaja"

# (naziv, jedinica mere, PDV, min cena, max cena, min količina, max količina, decimalna količina)
CATALOG = {
    "market": [
        ("mleko 2,8% 1l", "L", 10, "119.99", "139.99", 1, 3, False),
        ("hleb beli 500g", "KOM", 10, "59.99", "79.99", 1, 2, False),
        ("jabuke ajdared", "KG", 10, "89.99", "149.99", "0.500", "2.500", True),
        ("sok od pomorandže 1l", "KOM", 20, "149.99", "219.99", 1, 2, False),
        ("deterdžent za veš 3kg", "KOM", 20, "899.99", "1299.99", 1, 1, False),
        ("jaja m 10/1", "KUT", 10, "199.99", "289.99", 1, 2, False),
        ("čokolada mlečna 100g", "KOM", 20, "129.99", "179.99", 1, 4, False),
        ("kafa mlevena 200g", "KOM", 20, "349.99", "449.99", 1, 2, False),
        ("sir gauda", "KG", 10, "999.99", "1399.99", "0.200", "0.800", True),
        ("kesa", "KOM", 0, "4.99", "9.99", 1, 2, False),
    ],
    "apoteka": [
        ("brufen 400mg 30/1", "KUT", 10, "299.99", "399.99", 1, 2, False),
        ("vitamin c 1000mg", "KUT", 20, "499.99", "899.99", 1, 2, False),
        ("krema za ruke 75ml", "KOM", 20, "249.99", "449.99", 1, 1, False),
        ("flaster elastični", "KUT", 20, "149.99", "249.99", 1, 1, False),
    ],
    "pekara": [
        ("burek sa sirom", "KOM", 20, "229.99", "289.99", 1, 2, False),
        ("kifla", "KOM", 10, "24.99", "39.99", 2, 6, False),
        ("jogurt 0,5l", "KOM", 10, "79.99", "99.99", 1, 2, False),
        ("pogača", "KOM", 10, "149.99", "199.99", 1, 1, False),
    ],
    "restoran": [
        ("ćevapi 10 kom", "KOM", 20, "899.00", "1190.00", 1, 3, False),
        ("pljeskavica", "KOM", 20, "790.00", "990.00", 1, 2, False),
        ("šopska salata", "KOM", 20, "390.00", "490.00", 1, 2, False),
        ("kisela voda 0,25l", "KOM", 20, "180.00", "240.00", 1, 4, False),
        ("pivo 0,5l", "KOM", 20, "290.00", "390.00", 1, 4, False),
    ],
    "pumpa": [
        ("evro dizel", "L", 20, "189.00", "209.00", "20.00", "55.00", True),
        ("bmb 95", "L", 20, "179.00", "199.00", "15.00", "45.00", True),
        ("tečnost za brisače 2l", "KOM", 20, "349.99", "499.99", 1, 1, False),
        ("kafa za poneti", "KOM", 20, "149.99", "199.99", 1, 2, False),
    ],
    "tehnika": [
        ("usb-c kabl 1m", "KOM", 20, "599.99", "1499.99", 1, 2, False),
        ("bežične slušalice", "KOM", 20, "2499.99", "7999.99", 1, 1, False),
        ("baterije aa 4/1", "KUT", 20, "299.99", "499.99", 1, 2, False),
        ("kabl pp-y 3x1,5mm", "M", 20, "89.99", "129.99", "2.000", "15.000", True),
    ],
    "knjizara": [
        ("roman - na drini ćuprija", "KOM", 10, "999.00", "1499.00", 1, 1, False),
        ("sveska a4 kockice", "KOM", 20, "149.00", "249.00", 1, 4, False),
        ("hemijska olovka", "KOM", 20, "49.00", "99.00", 1, 5, False),
    ],
    "mesara": [
        ("svinjski vrat", "KG", 10, "799.99", "999.99", "0.500", "2.000", True),
        ("pileći file", "KG", 10, "649.99", "849.99", "0.500", "1.500", True),
        ("kobasica domaća", "KG", 10, "899.99", "1199.99", "0.300", "1.000", True),
    ],
    "drogerija": [
        ("šampon 400ml", "KOM", 20, "299.99", "549.99", 1, 2, False),
        ("pasta za zube 75ml", "KOM", 20, "149.99", "299.99", 1, 3, False),
        ("vlažne maramice 72/1", "KUT", 20, "129.99", "199.99", 1, 3, False),
    ],
    "kafic": [
        ("espreso", "KOM", 20, "150.00", "190.00", 1, 3, False),
        ("kapućino", "KOM", 20, "210.00", "260.00", 1, 3, False),
        ("domaća limunada", "KOM", 20, "250.00", "320.00", 1, 2, False),
    ],
}

# (PIB, naziv bez prefiksa, katalog, težina izbora, prodajna mesta [(naziv, adresa, mesto, opština)])
COMPANIES = [
    (900000001, "Market Šumadija", "market", 30, [
        ("Market Šumadija 1", "Bulevar Oslobođenja 12", "Novi Sad", "Novi Sad"),
        ("Market Šumadija 2", "Kralja Petra I 5", "Beograd", "Stari Grad"),
    ]),
    (900000002, "Apoteka Zdravlje Plus", "apoteka", 6, [
        ("Apoteka Zdravlje Plus Centar", "Zmaj Jovina 3", "Novi Sad", "Novi Sad"),
    ]),
    (900000003, "Pekara Kod Đure", "pekara", 14, [
        ("Pekara Kod Đure Liman", "Narodnog Fronta 21", "Novi Sad", "Novi Sad"),
        ("Pekara Kod Đure Detelinara", "Rumenačka 44", "Novi Sad", "Novi Sad"),
    ]),
    (900000004, "Restoran Čarda Na Dunavu", "restoran", 5, [
        ("Restoran Čarda Na Dunavu", "Ribarsko Ostrvo Bb", "Novi Sad", "Novi Sad"),
    ]),
    (900000005, "Benzinska Pumpa Brzi Točak", "pumpa", 8, [
        ("Pumpa Brzi Točak Sever", "Temerinski Put 2", "Novi Sad", "Novi Sad"),
        ("Pumpa Brzi Točak Jug", "Put Novosadskog Partizanskog Odreda 7", "Petrovaradin", "Petrovaradin"),
    ]),
    (900000006, "Tehnika Žica", "tehnika", 3, [
        ("Tehnika Žica", "Futoška 17", "Novi Sad", "Novi Sad"),
    ]),
    (900000007, "Knjižara Slovo", "knjizara", 3, [
        ("Knjižara Slovo", "Dunavska 8", "Novi Sad", "Novi Sad"),
    ]),
    (900000008, "Mesara Ćevap", "mesara", 7, [
        ("Mesara Ćevap Pijaca", "Riblja Pijaca 1", "Novi Sad", "Novi Sad"),
    ]),
    (900000009, "Drogerija Mirisna", "drogerija", 6, [
        ("Drogerija Mirisna", "Bulevar Mihajla Pupina 9", "Novi Sad", "Novi Sad"),
    ]),
    (900000010, "Kafić Ugao", "kafic", 8, [
        ("Kafić Ugao Centar", "Laze Telečkog 4", "Novi Sad", "Novi Sad"),
        ("Kafić Ugao Štrand", "Sunčani Kej 1", "Novi Sad", "Novi Sad"),
        ("Kafić Ugao Petrovaradin", "Beogradska 6", "Petrovaradin", "Petrovaradin"),
    ]),
]
SEED_TINS = [c[0] for c in COMPANIES]

# korisnik: {tip: (opis, [PIB-ovi])}; Mesara Ćevap kod qa_regular namerno nema tip
COMPANY_TYPES = {
    "qa_regular": {
        "Market": ("Supermarketi i drogerije", [900000001, 900000009]),
        "Apoteka": ("Apoteke", [900000002]),
        "Pekara": ("Pekare", [900000003]),
        "Restoran i kafić": ("Izlasci", [900000004, 900000010]),
        "Gorivo": ("Benzinske pumpe", [900000005]),
        "Tehnika i knjige": ("Elektronika i knjižare", [900000006, 900000007]),
    },
    "qa_regular_2": {
        "Hrana": ("Namirnice", [900000001, 900000003, 900000008]),
        "Izlasci": ("Restorani i kafići", [900000004, 900000010]),
    },
    "qa_regular_3": {
        "Svakodnevno": ("Sve što kupujem često", [900000001]),
    },
}

# (korisnik, indeks računa tog korisnika, zahtev, odgovor, zatvorena, viđena, dana posle računa)
REPORTS = [
    ("qa_regular", 1, "Iznos PDV-a na računu ne odgovara stavkama.", None, False, False, 1),
    ("qa_regular", 5, "Naziv stavke je pogrešno prikazan.", "Hvala na prijavi, naziv je ispravljen.", True, False, 2),
    ("qa_regular", 12, "Račun je prikazan dva puta.", "Proverili smo, račun je unet samo jednom.", True, True, 3),
    ("qa_regular_2", 0, "Prodajno mesto nije tačno.", None, False, False, 1),
    ("qa_regular_2", 4, "Nedostaje jedna stavka sa računa.", "Stavka je dodata.", True, False, 2),
]

#* Težine za sat kupovine (lokalno vreme, kao na računu)
HOUR_WEIGHTS = {
    0: 1, 1: 1, 6: 1, 7: 3, 8: 5, 9: 6, 10: 6, 11: 6, 12: 6, 13: 6, 14: 5, 15: 5,
    16: 6, 17: 8, 18: 9, 19: 8, 20: 6, 21: 4, 22: 2, 23: 1,
}

CENT = Decimal("0.01")


def _money(value):
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def _random_price(rng, low, high):
    return Decimal(rng.randint(int(Decimal(low) * 100), int(Decimal(high) * 100))) / 100


def _random_quantity(rng, low, high, decimal_quantity):
    if not decimal_quantity:
        return Decimal(rng.randint(low, high)).quantize(Decimal("0.001"))
    low, high = Decimal(low), Decimal(high)
    return (low + (high - low) * Decimal(rng.randint(0, 1000)) / 1000).quantize(Decimal("0.001"))


def _random_items(rng, catalog_key):
    products = CATALOG[catalog_key]
    count = rng.randint(1, min(6, len(products)))
    items = []
    for name, unit, vat, price_min, price_max, qty_min, qty_max, decimal_qty in rng.sample(products, count):
        items.append({
            "name": name,
            "measurementUnit": unit,
            "vatType": vat,
            "price": _random_price(rng, price_min, price_max),
            "quantity": _random_quantity(rng, qty_min, qty_max, decimal_qty),
        })
    return items


def _totals(items):
    total = Decimal("0")
    total_vat = Decimal("0")
    for item in items:
        line = _money(item["price"] * item["quantity"])
        total += line
        total_vat += _money(line * item["vatType"] / (100 + item["vatType"]))
    return _money(total), _money(total_vat)


def build_plan(anchor):
    """Čista funkcija: ceo seed skup kao liste dict-ova (isti rezultat za isti anchor)."""
    rng = random.Random(RNG_SEED)
    hours, hour_weights = zip(*HOUR_WEIGHTS.items())
    company_weights = [c[3] for c in COMPANIES]
    receipts = {username: [] for username in REGULAR_USERS}

    for username, (count, _active) in REGULAR_USERS.items():
        for index in range(count):
            tin, _name, catalog_key, _weight, units = rng.choices(COMPANIES, weights=company_weights)[0]
            if index < CURRENT_MONTH_RECEIPTS:
                days_back = rng.randint(0, anchor.day - 1)
            else:
                days_back = rng.randint(0, HISTORY_DAYS)
            day = anchor - timedelta(days=days_back)
            hour = rng.randint(7, 9) if days_back == 0 else rng.choices(hours, weights=hour_weights)[0]
            moment = datetime(day.year, day.month, day.day, hour, rng.randint(0, 59), rng.randint(0, 59), tzinfo=dt_timezone.utc)
            items = _random_items(rng, catalog_key)
            total, total_vat = _totals(items)
            receipts[username].append({
                "link": f"{LINK_PREFIX}{username}-{index + 1:03d}",
                "date": moment,
                "tin": tin,
                "unit_name": units[rng.randrange(len(units))][0],
                "totalPrice": total,
                "totalVat": total_vat,
                "items": items,
            })

    for index in SHARED_RECEIPT_INDEXES:
        receipts["qa_regular_2"].append(dict(receipts["qa_regular"][index]))

    reports = []
    for username, index, request, response, closed, seen, days_after in REPORTS:
        receipt = receipts[username][index]
        report_date = min(receipt["date"] + timedelta(days=days_after), datetime.combine(anchor, receipt["date"].timetz()))
        reports.append({
            "username": username, "link": receipt["link"], "date": report_date, "request": request,
            "response": response, "closed": closed, "seen": seen,
        })
    return receipts, reports


class Command(BaseCommand):
    help = "Pravi determinističke dev/test podatke (qa_regular, qa_admin, ~100 računa). Samo uz DEBUG=True."

    def add_arguments(self, parser):
        group = parser.add_mutually_exclusive_group()
        group.add_argument("--reset", action="store_true", help="obriši seed podatke, pa ih napravi ponovo")
        group.add_argument("--delete-only", action="store_true", help="samo obriši seed podatke")
        parser.add_argument(
            "--anchor-date",
            type=date.fromisoformat,
            default=None,
            help="dan od kog se datumi računaju unazad (YYYY-MM-DD, podrazumevano danas)",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("seed_dev_data radi samo kada je DEBUG=True (DJANGO_DEBUG=True u .env).")

        db_name = connection.settings_dict["NAME"]
        self.stdout.write(f"Baza: {db_name}")
        self._check_seed_tins_are_free()

        if options["reset"] or options["delete_only"]:
            with transaction.atomic():
                self._delete_seed_data()
            if options["delete_only"]:
                return

        anchor = options["anchor_date"] or timezone.now().date()
        password = os.environ.get(PASSWORD_ENV) or DEFAULT_PASSWORD
        receipts, reports = build_plan(anchor)
        with transaction.atomic():
            created = self._apply(receipts, reports, password)

        self._print_summary(created, anchor, password)

    # ------------------------------------------------------

    def _check_seed_tins_are_free(self):
        foreign = Company.objects.filter(tin__in=SEED_TINS).exclude(name__startswith=COMPANY_PREFIX)
        if foreign.exists():
            raise CommandError(
                "PIB-ovi rezervisani za seed već pripadaju preduzećima koja nisu seed: "
                + ", ".join(f"{c.tin} ({c.name})" for c in foreign)
            )

    def _delete_seed_data(self):
        users = User.objects.filter(username__in=SEED_USERNAMES)
        companies = Company.objects.filter(tin__in=SEED_TINS, name__startswith=COMPANY_PREFIX)
        counts = (users.count(), Receipt.objects.filter(user__in=users).count(), companies.count())
        #* CASCADE: računi -> stavke i prijave, tipovi preduzeća
        users.delete()
        CompanyUnit.objects.filter(company__in=companies).delete()
        companies.delete()
        self.stdout.write(
            "Obrisani seed podaci: korisnika %d, računa %d (sa stavkama i prijavama), preduzeća %d." % counts
        )

    def _ensure_user(self, username, password, *, admin=False, active=True):
        user = User.objects.filter(username=username).first()
        if user is None:
            email = f"{username}@{EMAIL_DOMAIN}"
            if admin:
                user = User.objects.create_superuser(username=username, email=email, password=password)
            else:
                user = User.objects.create_user(username=username, email=email, password=password, is_active=active)
            return user, True
        #* Lozinka se uvek vraća na seed vrednost (npr. posle testiranja promene lozinke)
        user.set_password(password)
        user.save(update_fields=["password"])
        return user, False

    def _apply(self, receipts, reports, password):
        created = {"users": 0, "companies": 0, "units": 0, "types": 0, "receipts": 0, "items": 0, "reports": 0}

        users = {}
        _admin, was_created = self._ensure_user(ADMIN_USERNAME, password, admin=True)
        created["users"] += was_created
        for username, (_count, active) in REGULAR_USERS.items():
            users[username], was_created = self._ensure_user(username, password, active=active)
            created["users"] += was_created

        companies, units = {}, {}
        for tin, name, _catalog, _weight, unit_rows in COMPANIES:
            companies[tin], was_created = Company.objects.get_or_create(tin=tin, defaults={"name": COMPANY_PREFIX + name})
            created["companies"] += was_created
            for unit_name, address, place, municipality in unit_rows:
                units[unit_name], was_created = CompanyUnit.objects.get_or_create(
                    company=companies[tin],
                    name=unit_name,
                    defaults={"address": address, "place": place, "municipality": municipality, "category": UNIT_CATEGORY},
                )
                created["units"] += was_created

        for username, types in COMPANY_TYPES.items():
            for type_name, (description, tins) in types.items():
                company_type, was_created = CompanyType.objects.get_or_create(
                    user=users[username], name=type_name, defaults={"description": description}
                )
                created["types"] += was_created
                for tin in tins:
                    companies[tin].type.add(company_type)

        receipt_objects = {}
        for username, user_receipts in receipts.items():
            for data in user_receipts:
                receipt, was_created = Receipt.objects.get_or_create(
                    user=users[username],
                    link=data["link"],
                    defaults={
                        "date": data["date"],
                        "companyUnit": units[data["unit_name"]],
                        "totalPrice": data["totalPrice"],
                        "totalVat": data["totalVat"],
                    },
                )
                receipt_objects[(username, data["link"])] = receipt
                if was_created:
                    created["receipts"] += 1
                    Item.objects.bulk_create([Item(receipt=receipt, **item) for item in data["items"]])
                    created["items"] += len(data["items"])

        for data in reports:
            _report, was_created = Report.objects.get_or_create(
                user=users[data["username"]],
                receipt=receipt_objects[(data["username"], data["link"])],
                request=data["request"],
                defaults={k: data[k] for k in ("date", "response", "closed", "seen")},
            )
            created["reports"] += was_created
        return created

    def _print_summary(self, created, anchor, password):
        seed_users = User.objects.filter(username__in=SEED_USERNAMES)
        totals = {
            "users": seed_users.count(),
            "companies": Company.objects.filter(tin__in=SEED_TINS).count(),
            "units": CompanyUnit.objects.filter(company__tin__in=SEED_TINS).count(),
            "types": CompanyType.objects.filter(user__in=seed_users).count(),
            "receipts": Receipt.objects.filter(user__in=seed_users).count(),
            "items": Item.objects.filter(receipt__user__in=seed_users).count(),
            "reports": Report.objects.filter(user__in=seed_users).count(),
        }
        labels = {
            "users": "korisnici", "companies": "preduzeća", "units": "prodajna mesta", "types": "tipovi preduzeća",
            "receipts": "računi", "items": "stavke", "reports": "prijave",
        }
        self.stdout.write(f"Seed podaci (datumi do {anchor.isoformat()}):")
        for key, label in labels.items():
            self.stdout.write(f"  {label:<17} ukupno {totals[key]:>4}  (novo: {created[key]})")
        self.stdout.write(self.style.SUCCESS("Nalozi (lozinka za sve: " + password + "):"))
        self.stdout.write(f"  {ADMIN_USERNAME:<13} ADMIN")
        for username, (_count, active) in REGULAR_USERS.items():
            self.stdout.write(f"  {username:<13} REGULAR{'' if active else ' (blokiran)'}")
