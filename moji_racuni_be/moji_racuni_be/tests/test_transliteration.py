"""
Testovi preslovljavanja srpske ćirilice u latinicu (moji_racuni_be/transliteration.py).
Ne koriste bazu.
"""
import pytest

from moji_racuni_be.transliteration import cyrillic_to_latin


def test_lowercase_alphabet():
    assert (
        cyrillic_to_latin("абвгдђежзијклљмнњопрстћуфхцчџш")
        == "abvgdđežzijklljmnnjoprstćufhcčdžš"
    )


def test_uppercase_alphabet():
    assert (
        cyrillic_to_latin("АБВГДЂЕЖЗИЈКЛЉМНЊОПРСТЋУФХЦЧЏШ")
        == "ABVGDĐEŽZIJKLLjMNNjOPRSTĆUFHCČDžŠ"
    )


@pytest.mark.parametrize(
    ("cyrillic", "latin"),
    [
        ("Љиљана", "Ljiljana"),
        ("Његош", "Njegoš"),
        ("Џем", "Džem"),
        ("Ђорђе", "Đorđe"),
        ("Ћуприја", "Ćuprija"),
        ("Жута Шљива", "Žuta Šljiva"),
    ],
)
def test_capitalized_words(cyrillic, latin):
    assert cyrillic_to_latin(cyrillic) == latin


def test_uppercase_digraph_letters_stay_capitalized_inside_uppercase_word():
    assert cyrillic_to_latin("ЉИЉА ЊИВА ЏЕП") == "LjILjA NjIVA DžEP"


def test_text_without_cyrillic_is_unchanged():
    text = "Hleb SAVA 500g, 1,25 kg / kom - ŠĐČĆŽ šđčćž (A) 20%"
    assert cyrillic_to_latin(text) == text


def test_mixed_text():
    assert cyrillic_to_latin("Хлеб SAVA 500г (Ђ)") == "Hleb SAVA 500g (Đ)"


def test_non_serbian_cyrillic_letters_are_unchanged():
    assert cyrillic_to_latin("ыщяёЯ") == "ыщяёЯ"


def test_empty_string():
    assert cyrillic_to_latin("") == ""
