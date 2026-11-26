"""
Preslovljavanje srpske ćirilice u latinicu.
"""

_LOWERCASE_CYRILLIC_TO_LATIN = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "ђ": "đ",
    "е": "e",
    "ж": "ž",
    "з": "z",
    "и": "i",
    "ј": "j",
    "к": "k",
    "л": "l",
    "љ": "lj",
    "м": "m",
    "н": "n",
    "њ": "nj",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "ћ": "ć",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ц": "c",
    "ч": "č",
    "џ": "dž",
    "ш": "š",
}

_CYRILLIC_TO_LATIN_TABLE = str.maketrans({
    **_LOWERCASE_CYRILLIC_TO_LATIN,
    **{cyr.upper(): lat.capitalize() for cyr, lat in _LOWERCASE_CYRILLIC_TO_LATIN.items()},
})


def cyrillic_to_latin(text):
    """
    Preslovljava srpsku ćirilicu u latinicu; svi ostali karakteri ostaju nepromenjeni.

    Velika slova Љ, Њ i Џ uvek postaju "Lj", "Nj" i "Dž", nezavisno od toga da li je
    ostatak reči napisan velikim slovima ("ЉИЉА" -> "LjILjA").
    """
    return text.translate(_CYRILLIC_TO_LATIN_TABLE)
