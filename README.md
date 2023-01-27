# Moji Računi

Web aplikacija za praćenje finansija. Skladišti podatke sa fiskalnih računa i na osnovu tih podataka pruža korisniku uvid u razne vrste statistika.

## Instalacija:

- `git clone https://github.com/ivang5/Moji-Racuni.git`
- Kroz MySQL Workbench kreirati šemu pod nazivom `moji_racuni` i za `charset/collation` izabrati `cp1250/cp1250_bin` (po potrebi u `settings.py` promeniti `DATABASES` podešavanja)
- Unutar `moji_racuni_be` direktorijuma:
  - Izvršiti `pip install -r requirements.txt` (idealno u posebnom virtualnom okruženju)
  - Izvršiti `python manage.py migrate`
  - Izvršiti `python manage.py createsuperuser` (za kreiranje administratora koji treba da bude predefinisan)
- Unutar `moji_racuni_fe` direktorijuma:
  - Izvršiti `npm install`
  - Navigirati se do `/src/utils/utils.js` i na vrhu fajla promeniti `BASE_URL` konstantu tako da bude formata `http://{IPv4 adresa vašeg uređaja na mreži}:8000` (npr. `http://192.168.1.1:8000`).

## Pokretanje:

- Unutar `moji_racuni_be` direktorijuma izvršiti `python manage.py runserver 0.0.0.0:8000`.
- Unutar `moji_racuni_fe` direktorijuma izvršiti `npm start`.
- Preko bilo kog uređaja na mreži pristupite aplikaciji na adresi `http://{IPv4 adresa host uređaja}:3000` (npr. `http://192.168.1.1:3000`)
