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
