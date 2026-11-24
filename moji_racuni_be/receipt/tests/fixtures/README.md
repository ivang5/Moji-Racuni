# Fixture-i za testove parsera računa

Ovde se čuvaju snapshot-ovi stvarnih stranica računa sa `suf.purs.gov.rs` i očekivani rezultati
parsiranja. Sadrže podatke o kupovini, pa se **ne commit-uju** (`*.html` i `*.expected.json` su
u `moji_racuni_be/.gitignore`). Ako u ovom direktorijumu nema fixture-a, parametrizovani test u
`receipt/tests/test_parser.py` se preskače, a ostali testovi (sintetički račun, greške) se izvršavaju.

Za svaki primer postoje dva fajla:

- `<naziv>.html` - sirov HTML stranice računa (sa originalnim `\r\n` prelomima reda),
- `<naziv>.expected.json` - očekivani rezultat `parse_company`, `parse_company_unit`,
  `parse_receipt` i `parse_items` (vidi `build_expected` u `test_parser.py`).

## Dodavanje novog primera

```bash
cd moji_racuni_be
source .venv/bin/activate
python -m receipt.tests.make_fixture market_kg "https://suf.purs.gov.rs/v/?vl=..."
pytest receipt/tests/test_parser.py
```

Skripta generiše `.expected.json` iz **trenutnog** izlaza parsera, zato svaku vrednost (PIB,
naziv, prodajno mesto, datum, ukupno, PDV, stavke) obavezno ručno uporediti sa PURS stranicom.

Napomena: HTML čitati/pisati kao bajtove (`read_bytes`/`write_bytes`). Otvaranje u text modu
(`open(...).read()`) u Python-u pretvara `\r\n` u `\n` i menja ono što parser dobija.
