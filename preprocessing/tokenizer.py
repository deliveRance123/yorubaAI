"""
Yoruba-Native Custom Tokenizer.
Engineered specifically for Yoruba orthography, preserving tones (ó, ò),
sub-dots (ẹ, ọ, ṣ), and common conversational elisions (káàbọ̀, kí lo fẹ́).
Uses Byte-Pair Encoding (BPE) with Unicode NFC canonical normalization
and byte-level fallback to ensure 100% crash-free encoding.
"""

import os
import sys
import unicodedata
from typing import List, Tuple, Union

# Ensure Windows prints Yoruba UTF-8 cleanly
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import ByteLevel
from tokenizers.decoders import ByteLevel as ByteLevelDecoder
from tokenizers.normalizers import Sequence, NFC


SPECIAL_TOKENS = ["<unk>", "<s>", "</s>", "<pad>", "<mask>"]


def build_yoruba_tokenizer() -> Tokenizer:
    """Instantiate and configure an untrained Yoruba BPE Tokenizer."""
    tokenizer = Tokenizer(BPE(unk_token="<unk>"))
    
    # 1. Normalization: Canonical Unicode NFC composition
    tokenizer.normalizer = Sequence([NFC()])
    
    # 2. Pre-tokenization: ByteLevel preserves spaces and enables byte fallback
    tokenizer.pre_tokenizer = ByteLevel(add_prefix_space=False)
    
    # 3. Decoder: Cleanly restores bytes to exact Unicode characters
    tokenizer.decoder = ByteLevelDecoder()
    
    return tokenizer


class YorubaTokenizer:
    """Wrapper class providing clean train, save, load, encode, and decode APIs."""
    
    def __init__(self, tokenizer: Tokenizer = None):
        self._tokenizer = tokenizer or build_yoruba_tokenizer()

    @classmethod
    def train_from_files(
        cls,
        files: List[str],
        vocab_size: int = 2048,
        min_frequency: int = 1
    ) -> "YorubaTokenizer":
        """Train a custom Yoruba BPE tokenizer on a list of text files."""
        tokenizer = build_yoruba_tokenizer()
        trainer = BpeTrainer(
            vocab_size=vocab_size,
            min_frequency=min_frequency,
            special_tokens=SPECIAL_TOKENS,
            initial_alphabet=ByteLevel.alphabet()
        )
        tokenizer.train(files, trainer)
        return cls(tokenizer)

    def save(self, filepath: str) -> None:
        """Save the tokenizer configuration and vocabulary to a JSON file."""
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        self._tokenizer.save(filepath)

    @classmethod
    def load(cls, filepath: str) -> "YorubaTokenizer":
        """Load a saved Yoruba tokenizer from a JSON file."""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Tokenizer file not found: {filepath}")
        return cls(Tokenizer.from_file(filepath))

    def encode(self, text: str) -> Tuple[List[int], List[str]]:
        """
        Encode Yoruba text into token IDs and string tokens.
        Ensures input is normalized to NFC before encoding.
        """
        norm_text = unicodedata.normalize("NFC", text)
        encoding = self._tokenizer.encode(norm_text)
        return encoding.ids, encoding.tokens

    def decode(self, ids: List[int]) -> str:
        """Decode a list of token IDs back into clean Yoruba text."""
        return self._tokenizer.decode(ids)

    @property
    def vocab_size(self) -> int:
        """Return the current vocabulary size."""
        return self._tokenizer.get_vocab_size()
