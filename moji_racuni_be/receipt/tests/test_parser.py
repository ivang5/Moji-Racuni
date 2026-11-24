"""
Testovi parsera stranice računa sa PURS-a (moji_racuni_be/utils.py, sekcija WEB-SCRAPING).
Ne koriste bazu ni mrežu.

- Sintetički račun (izmišljeni podaci) pokriva strukturu stranice i oba oblika preloma reda.
- Parametrizovani test prolazi kroz sve snapshot-ove stvarnih računa u fixtures/ (ne commit-uju
  se, vidi fixtures/README.md); ako ih nema, test se preskače.
"""
import json
from pathlib import Path

import pytest

from moji_racuni_be import utils

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"

FIXTURE_URL = "https://suf.purs.gov.rs/v/?vl=TEST"
FIXTURE_COMPANY_UNIT_ID = 1
FIXTURE_USER_ID = 1
FIXTURE_RECEIPT_ID = 1


def build_expected(html_text):
    """Rezultat svih parse_* funkcija za jednu stranicu, u obliku <naziv>.expected.json fajla."""
    company = utils.parse_company(html_text)
    return {
        "company": company,
        "company_unit": utils.parse_company_unit(html_text, company["tin"]),
        "receipt": utils.parse_receipt(html_text, FIXTURE_URL, FIXTURE_COMPANY_UNIT_ID, FIXTURE_USER_ID),
        "items": utils.parse_items(html_text, FIXTURE_RECEIPT_ID),
    }


# ----------------------------------------------------------
#  Sintetički račun (izmišljeni podaci, struktura kao na PURS-u)
# ----------------------------------------------------------

SYNTHETIC_JOURNAL = [
    "============ ФИСКАЛНИ РАЧУН ============",
    "               999999999                ",
    "           TEST PRODAVNICA              ",
    "       9999999-TEST PRODAVNICA 1        ",
    "            ТЕСТНА УЛИЦА 1              ",
    "                Нови Сад                ",
    "Касир:                              test",
    "ЕСИР број:                       123/1.0",
    "-------------ПРОМЕТ ПРОДАЈА-------------",
    "Артикли",
    "========================================",
    "Назив   Цена         Кол.         Укупно",
    "TEST JABUKE  [KG ] (Е)                  ",
    "       100,00      1,500          150,00",
    "TEST SOK 1L  [kom]                      ",
    " (Ђ)                                    ",
    "       120,00          2          240,00",
    "TEST KESA / kom (Г)                     ",
    "         5,00          1            5,00",
    "12345 TEST TELEVIZOR (А)                ",
    "     1.000,00          1        1.000,00",
    "----------------------------------------",
    "Укупан износ:                  1.395,00",
    "Готовина:                      1.395,00",
    "========================================",
    "Ознака       Име      Стопа        Порез",
    "Е           П-ПДВ   10,00%         13,64",
    "Ђ           О-ПДВ   20,00%         40,00",
    "А      Није у ПДВ    0,00%          0,00",
    "----------------------------------------",
    "Укупан износ пореза:               53,64",
    "========================================",
    "ПФР време:          5.2.2025. 09:07:30",
    "ПФР број рачуна:    TESTTEST-TESTTEST-1",
    "Бројач рачуна:                   1/1ПП",
    "========================================",
    "======== КРАЈ ФИСКАЛНОГ РАЧУНА =========",
]
#* Opseg linija sa stavkama (od prve stavke do linije '-----' ispod poslednje)
SYNTHETIC_ITEMS_START = SYNTHETIC_JOURNAL.index("Назив   Цена         Кол.         Укупно") + 1
SYNTHETIC_ITEMS_END = SYNTHETIC_JOURNAL.index("-" * 40)


def _form_group(label, value):
    return (
        '<div class="form-group">'
        f'<label class="col-form-label">{label}</label>'
        f'<div class="col-md-12"><span>{value}</span></div>'
        "</div>"
    )


def build_synthetic_html(newline, journal_lines=SYNTHETIC_JOURNAL):
    first_panel = [
        ("ПИБ", "\r\n    999999999\r\n    "),
        ("Име продајног места", "9999999-TEST PRODAVNICA 1"),
        ("Адреса", "ТЕСТНА УЛИЦА 1   "),
        ("Град", "НОВИ САД"),
        ("Општина", "Нови Сад"),
        ("ИД купца", ""),
        ("Затражио", "TESTTEST"),
        ("Врста", "Промет</span>\n<span>Продаја"),
    ]
    second_panel = [
        ("Укупан износ", "\r\n    1.395,00\r\n    "),
        ("Бројач по врсти трансакције", "1"),
        ("Бројач укупног броја", "1"),
        ("Екстензија бројача рачуна", "ПП"),
        ("Затражио - Потписао - Бројач", "TESTTEST-TESTTEST-1"),
        ("Потписао", "TESTTEST"),
        ("ПФР време (временска зона сервера)", "\r\n    5.2.2025. 09:07:30\r\n    "),
    ]

    def panel(groups):
        body = "".join(_form_group(label, value) for label, value in groups)
        return f'<div class="panel panel-info"><div class="panel-body">{body}</div></div>'

    journal = newline.join(journal_lines)
    return (
        "<html><body>"
        f"{panel(first_panel)}{panel(second_panel)}"
        f'<pre style="font-family:monospace">{journal}</pre>'
        "</body></html>"
    )


SYNTHETIC_EXPECTED = {
    "company": {"tin": 999999999, "name": "Test Prodavnica"},
    "company_unit": {
        "name": "9999999-Test Prodavnica 1",
        "address": "Testna Ulica 1",
        "place": "Novi Sad",
        "municipality": "Novi Sad",
        "category": "Promet\nProdaja",
        "company": 999999999,
    },
    "receipt": {
        "date": "2025-2-5 09:07:30",
        "link": FIXTURE_URL,
        "user": FIXTURE_USER_ID,
        "companyUnit": FIXTURE_COMPANY_UNIT_ID,
        "totalPrice": 1395.0,
        "totalVat": 53.64,
    },
    "items": [
        {"name": "test jabuke", "measurementUnit": "KG", "vatType": "10", "price": 100.0, "quantity": 1.5},
        {"name": "test sok 1l", "measurementUnit": "KOM", "vatType": "20", "price": 120.0, "quantity": 2.0},
        {"name": "test kesa", "measurementUnit": "KOM", "vatType": "0", "price": 5.0, "quantity": 1.0},
        {"name": "test televizor", "measurementUnit": "KOM", "vatType": "0", "price": 1000.0, "quantity": 1.0},
    ],
}
for _item in SYNTHETIC_EXPECTED["items"]:
    _item["receipt"] = FIXTURE_RECEIPT_ID


@pytest.mark.parametrize(
    "newline",
    [
        pytest.param("\r\n", id="crlf-kao-na-purs-u"),
        #* lxml >= 6.0 (libxml2 2.14) pri parsiranju pretvara '\r\n' u '\n' - uzrok kvara iz T01
        pytest.param("\n", id="lf-posle-html5-normalizacije"),
    ],
)
def test_synthetic_receipt_is_parsed_completely(newline):
    assert build_expected(build_synthetic_html(newline)) == SYNTHETIC_EXPECTED


# ----------------------------------------------------------
#  Snapshot-ovi stvarnih računa (fixtures/, nisu u repo-u)
# ----------------------------------------------------------

def _fixture_params():
    names = sorted(p.name[: -len(".expected.json")] for p in FIXTURES_DIR.glob("*.expected.json"))
    if not names:
        return [pytest.param(None, marks=pytest.mark.skip(reason="nema fixture-a u receipt/tests/fixtures/"))]
    return [pytest.param(name, id=name) for name in names]


@pytest.mark.parametrize("fixture_name", _fixture_params())
def test_real_receipt_snapshot_is_parsed_completely(fixture_name):
    #* Čitanje kao bajtovi: text mod bi '\r\n' pretvorio u '\n'
    html_text = (FIXTURES_DIR / f"{fixture_name}.html").read_bytes().decode("utf-8")
    expected = json.loads((FIXTURES_DIR / f"{fixture_name}.expected.json").read_text(encoding="utf-8"))
    assert build_expected(html_text) == expected


# ----------------------------------------------------------
#  Neočekivana struktura stranice -> InvalidReceiptError (400), nikad 500
# ----------------------------------------------------------

PARSERS = [
    pytest.param(lambda html: utils.parse_company(html), id="company"),
    pytest.param(lambda html: utils.parse_company_unit(html, 1), id="company_unit"),
    pytest.param(lambda html: utils.parse_receipt(html, FIXTURE_URL, 1, 1), id="receipt"),
    pytest.param(lambda html: utils.parse_items(html, 1), id="items"),
]


@pytest.mark.parametrize("parse", PARSERS)
@pytest.mark.parametrize(
    "html_text",
    [
        pytest.param("", id="prazna-stranica"),
        pytest.param("<html><body><h1>Greška</h1></body></html>", id="bez-podataka"),
        pytest.param("<html><body><pre>samo tekst</pre></body></html>", id="nepoznat-zurnal"),
    ],
)
def test_unexpected_page_raises_invalid_receipt(parse, html_text):
    with pytest.raises(utils.InvalidReceiptError):
        parse(html_text)


def test_receipt_without_items_raises_invalid_receipt():
    journal_without_items = SYNTHETIC_JOURNAL[:SYNTHETIC_ITEMS_START] + SYNTHETIC_JOURNAL[SYNTHETIC_ITEMS_END:]
    html_text = build_synthetic_html("\r\n", journal_without_items)
    with pytest.raises(utils.InvalidReceiptError):
        utils.parse_items(html_text, 1)
