# Moji Računi

Web aplikacija za praćenje finansija. Skladišti podatke sa fiskalnih računa i na osnovu tih podataka pruža korisniku uvid u razne vrste statistika.

## Instalacija:

- `git clone https://github.com/ivang5/Moji-Racuni.git`
- Kroz MySQL Workbench kreirati šemu pod nazivom `moji_racuni` i za `charset/collation` izabrati `cp1250/cp1250_bin` (podešavanja baze se menjaju u `.env`)
- Unutar `moji_racuni_be` direktorijuma:
  - Izvršiti `uv sync` (instalira Python 3.14 i zavisnosti iz `uv.lock`)
  - Kreirati `.env` fajl po uzoru na `moji_racuni_be/.env.example`.
    - Za lokalni razvoj obavezno postaviti `DJANGO_DEBUG=True`.
    - Ako pristupate sa drugih uređaja u mreži, u `DJANGO_ALLOWED_HOSTS` dodajte IP host uređaja (npr. `192.168.1.10`).
    - Za frontend lokalno, ostaviti `CORS_ALLOW_ALL_ORIGINS=True` ili podesiti `CORS_ALLOWED_ORIGINS` na frontend adrese.
  - Izvršiti `uv run python manage.py migrate`
  - Izvršiti `uv run python manage.py createsuperuser` (za kreiranje administratora koji treba da bude predefinisan)
- Unutar `moji_racuni_fe` direktorijuma:
  - Izvršiti `npm install`
  - Kreirati `.env` fajl po uzoru na `moji_racuni_fe/.env.example`.
    - Obavezno podesiti `REACT_APP_BASE_URL` na backend adresu u formatu `http://{IPv4 adresa host uređaja}:8000` (npr. `http://192.168.1.1:8000`).

## Pokretanje:

- Unutar `moji_racuni_be` direktorijuma izvršiti `uv run python manage.py runserver 0.0.0.0:8000`.
- Unutar `moji_racuni_fe` direktorijuma izvršiti `npm start`.
- Preko bilo kog uređaja na mreži pristupite aplikaciji na adresi `http://{IPv4 adresa host uređaja}:3000` (npr. `http://192.168.1.1:3000`)

## Testovi (backend):

- Unutar `moji_racuni_be` direktorijuma pokrenuti `uv run pytest`. Testovi rade nad MariaDB bazom `test_<DB_NAME>` (DB korisnik mora imati pravo `CREATE DATABASE`); posle izmene modela/migracija pokrenuti `uv run pytest --create-db`.
- `uv run pytest --endpoint-coverage` ispisuje koji API endpoint-i su pokriveni testovima.
- Snapshot-ovi stvarnih računa za testove parsera se ne čuvaju u repozitorijumu (vidi `moji_racuni_be/receipt/tests/fixtures/README.md`).

## Zavisnosti (backend):

- Zavisnosti su navedene u `moji_racuni_be/pyproject.toml`, a tačne verzije u `uv.lock`. Dodavanje paketa: `uv add <paket>`, ažuriranje: `uv lock --upgrade-package <paket>` pa `uv sync`.

## Backup i restore baze:

- `scripts/db_backup.sh [baza]` — pravi backup u `backups/` (kredencijali se čitaju iz `moji_racuni_be/.env`).
- `scripts/db_restore.sh <fajl> <ciljna_baza> [--replace]` — vraća backup; bazu koja već ima tabele menja samo uz `--replace`.
- `scripts/db_row_counts.sh [baza]` — broj redova po tabeli.

## Podaci za razvoj i testiranje:

Unutar `moji_racuni_be` direktorijuma (radi samo uz `DJANGO_DEBUG=True`):

```bash
uv run python manage.py seed_dev_data                # dodaje test podatke i naloge (qa_admin, qa_regular...)
uv run python manage.py seed_dev_data --delete-only  # uklanja samo test podatke
```
