"""
Yoruba-Native AI: Tone-Aware Phonetic Mapper (Phonemizer).
Decomposes canonical Yoruba text into base phonetic units (IPA)
and explicit tone tiers (High, Mid, Low) for acoustic voice modeling (TTS).
Handles conversational vowel elisions (Kú àbọ̀ -> Káàbọ̀).
"""

import re
import sys
import unicodedata
from typing import List, Tuple, Dict, Any

# Ensure UTF-8 printing on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


# Tone markers in Unicode
HIGH_TONE = "H"   # Ókè (Acute accent ´)
MID_TONE = "M"    # Àárín (Unmarked)
LOW_TONE = "L"    # Ìsàlẹ̀ (Grave accent `)

# Common conversational contractions to expand/normalize for natural speech
CONVERSATIONAL_ELISIONS = [
    ("Kú àbọ̀", "Káàbọ̀"),
    ("Ẹ kú àárọ̀", "Ẹ káàárọ̀"),
    ("Ẹ kú ìrọ̀lẹ́", "Ẹ kúùrọ̀lẹ́"),
    ("Ẹ kú alẹ́", "Ẹ káàlẹ́"),
    ("Kí ni o fẹ́", "Kí lo fẹ́"),
    ("Kí ni orúkọ rẹ", "Kí lorúkọ rẹ"),
    ("Kò sí ewu", "Kò séwu"),
    ("Wá jẹ oúnjẹ", "Wá jẹun"),
    ("Ọmọ tí ó dára", "Ọmọ tó dára"),
    ("Ẹni tí ó gbọ́n", "Ẹni tó gbọ́n"),
]


class YorubaPhonemizer:
    """Extracts phonetic segments and explicit tone contours from Yoruba text."""

    def __init__(self, apply_elisions: bool = True):
        self.apply_elisions = apply_elisions

    def normalize_text(self, text: str) -> str:
        """Apply Unicode NFC normalization and conversational speech elision."""
        text = unicodedata.normalize("NFC", text.strip())
        if self.apply_elisions:
            for target, replacement in CONVERSATIONAL_ELISIONS:
                norm_target = unicodedata.normalize("NFC", target)
                norm_replacement = unicodedata.normalize("NFC", replacement)
                # Case-insensitive phrase replacement
                pattern = re.compile(re.escape(norm_target), re.IGNORECASE)
                text = pattern.sub(norm_replacement, text)
        return text

    def extract_phonemes_and_tones(self, text: str) -> List[Tuple[str, str]]:
        """
        Decomposes a sentence into a sequence of (phoneme, tone) tuples.
        Consonants carry tone 'NONE'.
        Vowels and tone-bearing nasals carry 'H', 'M', or 'L'.
        """
        norm_text = self.normalize_text(text)
        result: List[Tuple[str, str]] = []

        # Decompose temporarily into NFD to inspect tone diacritics
        nfd = unicodedata.normalize("NFD", norm_text)

        idx = 0
        while idx < len(nfd):
            char = nfd[idx]

            # Digraph check for 'gb' and 'GB'
            if char.lower() == "g" and idx + 1 < len(nfd) and nfd[idx + 1].lower() == "b":
                result.append(("gb", "NONE"))
                idx += 2
                continue

            # Check if character is a vowel or tone-bearing nasal
            is_vowel = char.lower() in ["a", "e", "i", "o", "u"]
            is_nasal = char.lower() in ["m", "n"]

            # Check for combining marks (dot below \u0323, acute \u0301, grave \u0300)
            tone = MID_TONE if is_vowel else "NONE"
            subdot = False
            offset = 1

            while idx + offset < len(nfd) and unicodedata.category(nfd[idx + offset]) == "Mn":
                combining = nfd[idx + offset]
                if combining == "\u0301":  # Acute (High)
                    tone = HIGH_TONE
                elif combining == "\u0300":  # Grave (Low)
                    tone = LOW_TONE
                elif combining == "\u0323":  # Dot below (ẹ, ọ, ṣ)
                    subdot = True
                offset += 1

            # Base symbol reconstruction
            base_symbol = char
            if subdot:
                if char.lower() == "e":
                    base_symbol = "ẹ"
                elif char.lower() == "o":
                    base_symbol = "ọ"
                elif char.lower() == "s":
                    base_symbol = "ṣ"

            # Nasal tone-bearing check (ń, ǹ)
            if is_nasal and tone in [HIGH_TONE, LOW_TONE]:
                result.append((base_symbol, tone))
            elif is_vowel:
                result.append((base_symbol, tone))
            elif char.isalpha():
                result.append((base_symbol, "NONE"))
            elif char in " .,?!;:-":
                result.append((char, "PAUSE"))

            idx += offset

        return result

    def to_acoustic_repr(self, text: str) -> Dict[str, Any]:
        """Convert Yoruba text into an acoustic-model-ready dictionary."""
        norm_text = self.normalize_text(text)
        pairs = self.extract_phonemes_and_tones(norm_text)
        phonemes = [p[0] for p in pairs]
        tones = [p[1] for p in pairs]

        return {
            "original_text": text,
            "normalized_spoken_text": norm_text,
            "phonemes": phonemes,
            "tones": tones,
            "phoneme_string": " ".join(phonemes),
            "tone_string": " ".join(tones),
            "total_segments": len(phonemes)
        }
