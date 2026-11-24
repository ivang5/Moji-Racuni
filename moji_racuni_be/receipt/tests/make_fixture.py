"""
Snima HTML stranicu računa sa PURS-a kao fixture za testove parsera i generiše
<naziv>.expected.json iz trenutnog rezultata parsera.

Upotreba (iz direktorijuma moji_racuni_be/):
    python -m receipt.tests.make_fixture <naziv> "<link računa>"

VAŽNO: generisani .expected.json je samo polazna tačka - svaku vrednost ručno
proveriti naspram PURS stranice pre nego što se fixture prihvati.
Fixture fajlovi se ne commit-uju (vidi .gitignore i README.md u fixtures/).
"""
import json
import os
import sys
from pathlib import Path

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


def main(argv):
    if len(argv) != 3:
        print(__doc__)
        return 1
    name, url = argv[1], argv[2]

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "moji_racuni_be.settings")
    import django
    django.setup()

    from moji_racuni_be import utils
    from receipt.tests.test_parser import build_expected

    html_text = utils._fetch_url_text(url)
    expected = build_expected(html_text)

    FIXTURES_DIR.mkdir(exist_ok=True)
    #* write_bytes čuva '\r\n' prelome reda tačno onako kako ih PURS šalje
    (FIXTURES_DIR / f"{name}.html").write_bytes(html_text.encode("utf-8"))
    expected_json = json.dumps(expected, ensure_ascii=False, indent=2)
    (FIXTURES_DIR / f"{name}.expected.json").write_text(expected_json + "\n", encoding="utf-8")

    print(expected_json)
    print(f"\nSačuvano u {FIXTURES_DIR}/{name}.(html|expected.json) - proveriti vrednosti ručno!")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
