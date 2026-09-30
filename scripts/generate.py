"""
Generate Yoruba text completions using a trained Yoruba Language Model checkpoint.
"""

import os
import sys
import argparse
import torch

# Ensure UTF-8 printing on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models.language.config import YorubaLMConfig
from models.language.transformer import YorubaLanguageModel
from preprocessing.tokenizer import YorubaTokenizer


def generate_text(
    prompt: str = "Báwo ni",
    checkpoint_path: str = "experiments/checkpoints/yoruba_lm_0001.pt",
    tokenizer_path: str = "configs/yoruba_tokenizer.json",
    max_new_tokens: int = 30,
    temperature: float = 0.8,
    top_k: int = 10
):
    if not os.path.exists(checkpoint_path):
        print(f"Error: Checkpoint not found at {checkpoint_path}")
        print("Please train the model first by running: python training/language/train.py")
        sys.exit(1)

    if not os.path.exists(tokenizer_path):
        print(f"Error: Tokenizer not found at {tokenizer_path}")
        sys.exit(1)

    # 1. Load Tokenizer
    tokenizer = YorubaTokenizer.load(tokenizer_path)

    # 2. Load Checkpoint and Config
    checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
    config = YorubaLMConfig(**checkpoint["config"])
    model = YorubaLanguageModel(config)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # 3. Encode Prompt
    prompt_ids, prompt_tokens = tokenizer.encode(prompt)
    if not prompt_ids:
        prompt_ids = [0]
    idx = torch.tensor([prompt_ids], dtype=torch.long)

    # 4. Generate
    with torch.no_grad():
        out_idx = model.generate(idx, max_new_tokens=max_new_tokens, temperature=temperature, top_k=top_k)

    # 5. Decode
    generated_ids = out_idx[0].tolist()
    generated_text = tokenizer.decode(generated_ids)

    print("=" * 60)
    print("YORUBA LANGUAGE MODEL TEXT GENERATION")
    print("=" * 60)
    print(f"Prompt:     \"{prompt}\"")
    print(f"Generation: \"{generated_text}\"")
    print("=" * 60)

    return generated_text


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Yoruba text with YorubaLM")
    parser.add_argument("--prompt", type=str, default="Báwo ni", help="Initial Yoruba prompt")
    parser.add_argument("--tokens", type=int, default=30, help="Number of new tokens to generate")
    parser.add_argument("--temp", type=float, default=0.8, help="Sampling temperature")
    parser.add_argument("--top_k", type=int, default=10, help="Top-k sampling threshold")
    args = parser.parse_args()

    generate_text(
        prompt=args.prompt,
        max_new_tokens=args.tokens,
        temperature=args.temp,
        top_k=args.top_k
    )
