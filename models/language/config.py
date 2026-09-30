"""
Configuration dataclass for the Sovereign Yoruba Language Model.
"""

from dataclasses import dataclass, asdict
import json
import os


@dataclass
class YorubaLMConfig:
    vocab_size: int = 1147       # Matched to our custom Yoruba tokenizer
    max_seq_len: int = 128       # Context window (tokens)
    d_model: int = 128           # Embedding / hidden dimension
    n_heads: int = 4             # Number of attention heads (d_head = 128 / 4 = 32)
    n_layers: int = 4            # Number of Transformer blocks
    dropout: float = 0.1         # Dropout probability
    bias: bool = False           # Modern standard: False for faster, cleaner representations

    @property
    def d_head(self) -> int:
        assert self.d_model % self.n_heads == 0, "d_model must be divisible by n_heads"
        return self.d_model // self.n_heads

    def to_dict(self) -> dict:
        return asdict(self)

    def save_json(self, filepath: str) -> None:
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def from_json(cls, filepath: str) -> "YorubaLMConfig":
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls(**data)
