import sys
import unicodedata

# Ensure Windows terminal outputs UTF-8 cleanly without cp1252 crashes
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

def normalize_yoruba(text: str) -> str:
    """Normalize any incoming Yoruba string into canonical Unicode NFC."""
    return unicodedata.normalize("NFC", text)

def test_yoruba_sample():
    # Test sample with tones, sub-dots, and natural elision
    samples = [
        ("Kú àbọ̀", "Formal greeting"),
        ("Káàbọ̀", "Contracted spoken greeting"),
        ("Ẹ kú àárọ̀ o", "Morning greeting to elders"),
        ("Ọmọdé kò mọ egbò, ó ń pè é ní eṣinṣin", "Classic proverb"),
        ("Ṣé o wà dáadáa?", "Conversational check-in")
    ]
    
    print("=" * 60)
    print("YORUBA UNICODE NFC NORMALIZATION VERIFICATION")
    print("=" * 60)
    
    for text, label in samples:
        norm = normalize_yoruba(text)
        print(f"\n[{label}]")
        print(f"  Raw:        {text}")
        print(f"  Normalized: {norm}")
        print(f"  Code Points: {[f'U+{ord(c):04X}' for c in norm]}")
        assert len(norm) > 0, "String must not be empty"
        assert norm == unicodedata.normalize("NFC", norm), "Must be canonical NFC"

    print("\n" + "=" * 60)
    print("ALL YORUBA LINGUISTIC UNICODE TESTS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    test_yoruba_sample()
