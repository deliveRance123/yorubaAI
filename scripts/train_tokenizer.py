"""
Train the Custom Yoruba Tokenizer on curated text datasets.
Saves the trained model to configs/yoruba_tokenizer.json.
"""

import os
import sys

# Ensure UTF-8 printing on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from preprocessing.tokenizer import YorubaTokenizer


def main():
    corpus_path = os.path.join("data", "text", "seed_yoruba_corpus.txt")
    output_path = os.path.join("configs", "yoruba_tokenizer.json")
    
    if not os.path.exists(corpus_path):
        print(f"Error: Corpus file not found at {corpus_path}")
        sys.exit(1)
        
    print("=" * 60)
    print("TRAINING CUSTOM YORUBA TOKENIZER")
    print("=" * 60)
    print(f"Corpus:      {corpus_path}")
    print(f"Target Save: {output_path}")
    print("Algorithm:   Byte-Pair Encoding (BPE) with Unicode NFC Normalizer")
    print("Special:     <unk>, <s>, </s>, <pad>, <mask>")
    
    # Train on corpus
    tokenizer = YorubaTokenizer.train_from_files(
        files=[corpus_path],
        vocab_size=2048,
        min_frequency=1
    )
    
    # Save trained artifact
    tokenizer.save(output_path)
    
    print("-" * 60)
    print(f"Training Complete! Active Vocab Size: {tokenizer.vocab_size} tokens")
    print(f"Tokenizer saved to: {output_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
