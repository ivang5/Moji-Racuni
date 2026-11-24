# Moji Računi

Web aplikacija za praćenje finansija. Skladišti podatke sa fiskalnih računa i na osnovu tih podataka pruža korisniku uvid u razne vrste statistika.

## Instalacija:

- `git clone https://github.com/ivang5/Moji-Racuni.git`
- Kroz MySQL Workbench kreirati šemu pod nazivom `moji_racuni` i za `charset/collation` izabrati `cp1250/cp1250_bin` (po potrebi u `settings.py` promeniti `DATABASES` podešavanja)
- Unutar `moji_racuni_be` direktorijuma:
  - Izvršiti `pip install -r requirements.txt` (idealno u posebnom virtualnom okruženju)
  - Kreirati `.env` fajl po uzoru na `moji_racuni_be/.env.example`.
    - Za lokalni razvoj obavezno postaviti `DJANGO_DEBUG=True`.
    - Ako pristupate sa drugih uređaja u mreži, u `DJANGO_ALLOWED_HOSTS` dodajte IP host uređaja (npr. `192.168.1.10`).
    - Za frontend lokalno, ostaviti `CORS_ALLOW_ALL_ORIGINS=True` ili podesiti `CORS_ALLOWED_ORIGINS` na frontend adrese.
  - Izvršiti `python manage.py migrate`
  - Izvršiti `python manage.py createsuperuser` (za kreiranje administratora koji treba da bude predefinisan)
- Unutar `moji_racuni_fe` direktorijuma:
  - Izvršiti `npm install`
  - Kreirati `.env` fajl po uzoru na `moji_racuni_fe/.env.example`.
    - Obavezno podesiti `REACT_APP_BASE_URL` na backend adresu u formatu `http://{IPv4 adresa host uređaja}:8000` (npr. `http://192.168.1.1:8000`).

## Pokretanje:

- Unutar `moji_racuni_be` direktorijuma izvršiti `python manage.py runserver 0.0.0.0:8000`.
- Unutar `moji_racuni_fe` direktorijuma izvršiti `npm start`.
- Preko bilo kog uređaja na mreži pristupite aplikaciji na adresi `http://{IPv4 adresa host uređaja}:3000` (npr. `http://192.168.1.1:3000`)

## Testovi (backend):

- Unutar `moji_racuni_be` direktorijuma instalirati dev zavisnosti: `pip install -r requirements-dev.txt` (ili `uv pip install -r requirements-dev.txt`).
- Pokrenuti `pytest`. Testovi API-ja rade nad MariaDB test bazom `test_<DB_NAME>` (pravi je Django; DB korisnik mora imati pravo `CREATE DATABASE`). Baza se čuva između pokretanja; posle izmene modela/migracija pokrenuti `pytest --create-db`.
- `pytest --endpoint-coverage` na kraju ispisuje koji API endpoint-i (ruta + HTTP metod) su pogođeni testovima.
- Testovi parsera računa ne koriste bazu ni mrežu; PURS se u svim testovima mock-uje.
- Snapshot-ovi stvarnih računa za testove parsera se ne čuvaju u repozitorijumu; uputstvo za dodavanje je u `moji_racuni_be/receipt/tests/fixtures/README.md`.

## Backup i restore baze:

Skripte čitaju kredencijale iz `moji_racuni_be/.env` (lozinka se ne prosleđuje preko komandne linije).

- `scripts/db_backup.sh [baza]` — pravi `backups/<baza>_<timestamp>.sql.gz` (podrazumevano baza iz `.env`).
- `scripts/db_restore.sh <fajl> <ciljna_baza> [--replace]` — vraća backup u zadatu bazu. Nepostojeća baza se pravi sa istim charset-om; bazu koja već ima tabele menja samo uz `--replace` (i pre toga pravi njen backup); restore u glavnu bazu iz `.env` traži potvrdu (ukucati ime baze ili `--confirm <ime_baze>`).
- `scripts/db_row_counts.sh [baza]` — tačan broj redova po tabeli (npr. za poređenje pre/posle restore-a).

## Podaci za razvoj i testiranje:

Unutar `moji_racuni_be` direktorijuma:

```bash
python manage.py seed_dev_data                # dodaje test podatke u bazu iz .env
python manage.py seed_dev_data --delete-only  # uklanja samo test podatke
```

Test podaci su jasno obeleženi, pa se mogu dodati i u bazu sa postojećim podacima. Za zasebnu bazu dovoljno je zadati je env varijablom, koja ima prednost nad `.env` (npr. `DB_NAME=moji_racuni_dev python manage.py migrate`, pa isto za `seed_dev_data` i `runserver`).

`seed_dev_data` (radi samo uz `DJANGO_DEBUG=True`) pravi naloge `qa_admin`, `qa_regular`, `qa_regular_2`, `qa_regular_3` i `qa_regular_4` (blokiran), 10 preduzeća (`[SEED] ...`, PIB 900000001–900000010), ~110 računa kroz poslednjih 14 meseci, stavke i prijave. Lozinka se ispisuje na kraju (menja se env varijablom `SEED_PASSWORD`). Komanda je idempotentna; `--reset` briše i ponovo pravi samo seed podatke, `--delete-only` ih samo briše.
