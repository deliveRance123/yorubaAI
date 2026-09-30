"""
Training Loop for the Sovereign Yoruba Language Model.
Trains on curated Yoruba text and saves versioned model checkpoints.
"""

import os
import sys
import time
import math
import torch
from torch.utils.data import DataLoader

# Ensure UTF-8 printing on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from models.language.config import YorubaLMConfig
from models.language.transformer import YorubaLanguageModel
from preprocessing.tokenizer import YorubaTokenizer
from training.language.dataset import YorubaTextDataset


def train_model(
    corpus_file: str = "data/text/seed_yoruba_corpus.txt",
    tokenizer_file: str = "configs/yoruba_tokenizer.json",
    checkpoint_dir: str = "experiments/checkpoints",
    model_version: str = "yoruba_lm_0001",
    num_epochs: int = 150,
    batch_size: int = 16,
    learning_rate: float = 5e-4,
    seq_len: int = 64
):
    print("=" * 70)
    print(f"TRAINING SOVEREIGN YORUBA LANGUAGE MODEL ({model_version})")
    print("=" * 70)

    # 1. Load Tokenizer
    if not os.path.exists(tokenizer_file):
        raise FileNotFoundError(f"Tokenizer not found at {tokenizer_file}")
    tokenizer = YorubaTokenizer.load(tokenizer_file)
    print(f"Loaded Tokenizer: {tokenizer.vocab_size} vocabulary tokens")

    # 2. Build Dataset
    dataset = YorubaTextDataset([corpus_file], tokenizer, seq_len=seq_len)
    if len(dataset) == 0:
        raise ValueError("Dataset is empty. Check corpus file.")
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, drop_last=False)
    print(f"Dataset Size:     {len(dataset)} training sequences (window: {seq_len})")

    # 3. Initialize Model Architecture
    config = YorubaLMConfig(
        vocab_size=tokenizer.vocab_size,
        max_seq_len=seq_len,
        d_model=128,
        n_heads=4,
        n_layers=4,
        dropout=0.1
    )
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Target Compute:   {device.upper()}")

    model = YorubaLanguageModel(config).to(device)
    total_params = model.num_parameters()
    print(f"Total Parameters: {total_params:,} (~{total_params / 1e6:.2f} Million parameters)")
    print("-" * 70)

    # 4. Optimizer & Loss
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=0.01)

    # 5. Training Loop
    model.train()
    start_time = time.time()

    initial_loss = None
    final_loss = None

    for epoch in range(1, num_epochs + 1):
        epoch_loss = 0.0
        steps = 0

        for x, y in dataloader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad()
            _, loss = model(x, y)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            epoch_loss += loss.item()
            steps += 1

        avg_loss = epoch_loss / max(steps, 1)
        if initial_loss is None:
            initial_loss = avg_loss
        final_loss = avg_loss

        # Print progress every 25 epochs
        if epoch == 1 or epoch % 25 == 0 or epoch == num_epochs:
            perplexity = math.exp(min(avg_loss, 20.0))
            elapsed = time.time() - start_time
            print(f"Epoch [{epoch:03d}/{num_epochs:03d}] | Loss: {avg_loss:.4f} | Perplexity: {perplexity:6.2f} | Time: {elapsed:.1f}s")

    # 6. Save Checkpoint
    os.makedirs(checkpoint_dir, exist_ok=True)
    checkpoint_path = os.path.join(checkpoint_dir, f"{model_version}.pt")
    config_path = os.path.join(checkpoint_dir, f"{model_version}_config.json")

    torch.save({
        "model_state_dict": model.state_dict(),
        "config": config.to_dict(),
        "vocab_size": config.vocab_size,
        "initial_loss": initial_loss,
        "final_loss": final_loss,
        "total_params": total_params,
        "timestamp": time.time()
    }, checkpoint_path)
    config.save_json(config_path)

    print("-" * 70)
    print(f"Training Complete in {time.time() - start_time:.2f}s!")
    print(f"Loss Improvement: {initial_loss:.4f} -> {final_loss:.4f}")
    print(f"Checkpoint Saved: {checkpoint_path}")
    print(f"Config Saved:     {config_path}")
    print("=" * 70)

    return model, config, checkpoint_path


if __name__ == "__main__":
    train_model()
