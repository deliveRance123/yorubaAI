"""
PyTorch Dataset for Causal Language Modeling on Yoruba text.
Streams Yoruba text, applies our custom Yoruba tokenizer, and produces
shifted target pairs (x, y) where y_t = x_{t+1}.
"""

import os
from typing import List, Tuple
import torch
from torch.utils.data import Dataset

from preprocessing.tokenizer import YorubaTokenizer


class YorubaTextDataset(Dataset):
    """Dataset that produces fixed-length token chunks for next-token prediction."""

    def __init__(self, file_paths: List[str], tokenizer: YorubaTokenizer, seq_len: int = 64):
        self.seq_len = seq_len
        self.tokenizer = tokenizer

        all_tokens: List[int] = []
        for path in file_paths:
            if not os.path.exists(path):
                continue
            with open(path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            for line in lines:
                line = line.strip()
                # Skip comments and empty lines
                if not line or line.startswith("#"):
                    continue
                ids, _ = tokenizer.encode(line)
                all_tokens.extend(ids)

        self.tokens = torch.tensor(all_tokens, dtype=torch.long)

    def __len__(self) -> int:
        # Number of complete chunks of length seq_len + 1
        return max(0, len(self.tokens) - self.seq_len)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        # Chunk of size seq_len + 1
        chunk = self.tokens[idx : idx + self.seq_len + 1]
        x = chunk[:-1]  # Inputs
        y = chunk[1:]   # Targets (shifted by 1 token)
        return x, y
