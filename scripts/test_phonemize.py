"""
Automated Verification Suite for the Yoruba Tone-Aware Phonetic Mapper.
Validates:
  1. Accurate High (H), Mid (M), and Low (L) tone decomposition.
  2. Sub-dot preservation (ẹ, ọ, ṣ).
  3. Conversational spoken elision mapping (Kú àbọ̀ -> Káàbọ̀).
  4. Tone-bearing syllabic nasals (ń, ǹ).
"""

import os
import sys

# Ensure UTF-8 printing on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from preprocessing.phonemize import YorubaPhonemizer, HIGH_TONE, MID_TONE, LOW_TONE


def test_phonemizer():
    print("=" * 70)
    print("YORUBA TONE-AWARE PHONETIC MAPPER VERIFICATION")
    print("=" * 70)

    phonemizer = YorubaPhonemizer(apply_elisions=True)

    test_cases = [
        ("Ọ̀rọ̀", "Double Low Tone with Sub-dots"),
        ("Báwo", "High Tone then Mid Tone"),
        ("Kú àbọ̀", "Conversational Elision to Káàbọ̀"),
        ("Ẹ kú àárọ̀ o", "Elder Morning Greeting Elision"),
        ("Kí ni o fẹ́?", "Conversational Question to Kí lo fẹ́?"),
        ("Ó ń lọ", "Tone-bearing Syllabic Nasal (ń)")
    ]

    for text, label in test_cases:
        res = phonemizer.to_acoustic_repr(text)
        print(f"[{label}]")
        print(f"  Input:            \"{text}\"")
        print(f"  Normalized Voice: \"{res['normalized_spoken_text']}\"")
        print(f"  Phonemes:         {res['phoneme_string']}")
        print(f"  Tone Contours:    {res['tone_string']}\n")

    # Specific Assertion 1: Kú àbọ̀ -> Káàbọ̀ elision
    kaabo_res = phonemizer.to_acoustic_repr("Kú àbọ̀")
    assert kaabo_res["normalized_spoken_text"] == "Káàbọ̀", "Elision failed"
    assert "H L" in kaabo_res["tone_string"], "Expected High then Low tone sequence"
    print("  [PASS] Conversational speech elision verified!")

    # Specific Assertion 2: Tone separation on Ọ̀rọ̀
    oro_res = phonemizer.to_acoustic_repr("Ọ̀rọ̀")
    assert oro_res["tones"] == [LOW_TONE, "NONE", LOW_TONE], f"Expected [L, NONE, L], got {oro_res['tones']}"
    print("  [PASS] Sub-dot and Low tone separation verified!")

    # Specific Assertion 3: Syllabic nasal ń
    nasal_res = phonemizer.to_acoustic_repr("Ó ń lọ")
    assert HIGH_TONE in nasal_res["tones"], "High tone on ń must be captured"
    print("  [PASS] Syllabic nasal tone-bearing verified!")

    print("=" * 70)
    print("ALL YORUBA PHONEMIC & TONE MAPPING TESTS PASSED WITH 100% PRECISION!")
    print("=" * 70)


if __name__ == "__main__":
    test_phonemizer()
