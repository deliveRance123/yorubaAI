# Yoruba-Native AI (Yorùbá AI)

> An independent, sovereign artificial intelligence system designed to naturally understand, generate, and speak Yoruba with cultural fidelity and authentic tonal prosody.

---

## 🌍 Vision & Philosophy
This is **NOT** a generic English chatbot translated into Yoruba.
The mission is to build an independent Yoruba-focused AI system with its own:
* Curated cultural text and voice datasets.
* Custom Yoruba tokenizer preserving tone marks and sub-dots.
* Native language model trained from scratch.
* Tone-aware Speech Recognition (ASR) and Voice Synthesis (TTS).
* Community-driven data collection and native-speaker evaluation platform.

---

## 📁 Repository Structure

```text
yoruba-ai/
├── configs/            # Experiment and model hyperparameters
├── database/           # Neon PostgreSQL schemas and metadata migrations
├── data/               # Curated datasets (split into text, speech, evaluation)
│   ├── raw/            # Untouched incoming submissions
│   ├── processed/      # Cleaned and NFC-normalized datasets
│   ├── text/           # Cultural text, proverbs, idioms, literature
│   ├── speech/         # Audio clips with verified paired transcripts
│   └── evaluation/     # Benchmarks for native-speaker evaluation
├── preprocessing/      # Text normalization, tone validation, audio cleaning
├── models/             # Architecture definitions for LM, ASR, and TTS
│   ├── language/       # Transformer language model blueprints
│   ├── asr/            # Speech-to-Text models
│   └── tts/            # Text-to-Speech acoustic & vocoder models
├── training/           # Self-contained, portable training loops
│   ├── language/       # LM training scripts
│   ├── asr/            # ASR fine-tuning / training
│   └── tts/            # Voice model training
├── evaluation/         # Automated metrics (Loss, Perplexity, CER/WER, BLEU)
├── experiments/        # Checkpoints, logs, and experiment trackers
├── scripts/            # CLI utilities for data ingestion & inspection
└── docs/               # Project specifications and linguistic guides
    └── yoruba_linguistic_standards.md
```

---

## 🛠️ Current Status: Phase 0
* [x] Master specification defined.
* [x] Linguistic standards documented (*Yorùbá Àjùmọ̀lò*, 3 tones, sub-dots, elision).
* [x] Cloud-first and low-spec PC architecture established.
* [ ] Custom Yoruba Tokenizer construction.
* [ ] Tiny from-scratch language model research milestone.
