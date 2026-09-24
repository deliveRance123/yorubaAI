# Yoruba Linguistic & Orthographic Standards

## 1. Scope & Purpose
This document defines the linguistic and orthographic rules for the **Yoruba-Native AI** project.
All text datasets, tokenizers, phonetic dictionaries, and speech transcriptions must adhere to these standards.

The baseline dialect for general intelligence is **General Yoruba (*Yorùbá Àjùmọ̀lò*)**.

---

## 2. The Yoruba Alphabet (Alifabẹ́ẹ̀tì Yorùbá)
Yoruba uses a modified Latin alphabet containing **25 letters**:

| Letter | Case | Pronunciation Note |
| :--- | :--- | :--- |
| A a | Standard | Open vowel |
| B b | Standard | Voiced bilabial plosive |
| D d | Standard | Voiced alveolar plosive |
| E e | Standard | Close-mid front unrounded vowel [e] |
| Ẹ ẹ | **Sub-dot** | Open-mid front unrounded vowel [ɛ] |
| F f | Standard | Voiceless labiodental fricative |
| G g | Standard | Voiced velar plosive |
| GB gb | Digraph | Voiced labial-velar plosive |
| H h | Standard | Voiceless glottal fricative |
| I i | Standard | Close front unrounded vowel [i] |
| J j | Standard | Voiced postalveolar affricate [dʒ] |
| K k | Standard | Voiceless velar plosive |
| L l | Standard | Alveolar lateral approximant |
| M m | Standard | Bilabial nasal (can be syllabic/tone-bearing) |
| N n | Standard | Alveolar nasal (can be syllabic/tone-bearing) |
| O o | Standard | Close-mid back rounded vowel [o] |
| Ọ ọ | **Sub-dot** | Open-mid back rounded vowel [ɔ] |
| P p | Standard | Voiceless labial-velar plosive [k͡p] (pronounced "kp") |
| R r | Standard | Alveolar tap/trill |
| S s | Standard | Voiceless alveolar fricative [s] |
| Ṣ ṣ | **Sub-dot** | Voiceless postalveolar fricative [ʃ] (pronounced "sh") |
| T t | Standard | Voiceless alveolar plosive |
| U u | Standard | Close back rounded vowel [u] |
| W w | Standard | Voiced labio-velar approximant |
| Y y | Standard | Palatal approximant |

*(Letters C, Q, V, X, Z do not exist in traditional Yoruba orthography).*

---

## 3. The 3 Tonal Levels (Àmì Ohùn)
Yoruba is a tonal language. Pitch level changes the meaning of a word completely:

1. **Àmì Ókè (High Tone):** Marked with an acute accent (`´`). Pitch rises.
   * Example: *Bá* (to meet / accompany)
2. **Àmì Àárín (Mid Tone):** Usually **unmarked** in standard orthography. Pitch remains neutral.
   * Example: *Ba* (to perch / hide)
3. **Àmì Ìsàlẹ̀ (Low Tone):** Marked with a grave accent (`` ` ``). Pitch drops.
   * Example: *Bà* (to land / alight)

### Syllabic Nasals as Tone Bearers
The consonants **m** and **n** can act as syllables and carry tones:
* High tone nasal: *ń* (as in *ó ń lọ* = he/she is going)
* Low tone nasal: *ǹ* (as in *ǹjẹ́* = is it that...?)

---

## 4. Spoken Contraction & Elision (Ìsúnkì Ọ̀rọ̀ àti Ìyọ́ Fáwẹ́lì)
Natural conversational Yoruba frequently merges adjacent vowels and contracts common greetings and phrases:

| Formal Orthography | Spoken / Contracted Flow | Meaning |
| :--- | :--- | :--- |
| Kú àbọ̀ | **Káàbọ̀** | Welcome |
| Ẹ kú àárọ̀ | **Ẹ káàárọ̀** | Good morning |
| Ẹ kú ìrọ̀lẹ́ | **Ẹ kúùrọ̀lẹ́ / Ẹ káàlẹ́** | Good evening |
| Kí ni o fẹ́? | **Kí lo fẹ́?** | What do you want? |
| Kí ni orúkọ rẹ? | **Kí lorúkọ rẹ?** | What is your name? |
| Kò sí ewu | **Kò séwu** | No problem / safe |
| Wá jẹ oúnjẹ | **Wá jẹun** | Come and eat |
| Ọmọ tí ó dára | **Ọmọ tó dára** | A good child |

* **ASR (Speech-to-Text)** must recognize both contracted spoken forms and formal written forms.
* **TTS (Text-to-Speech)** must pronounce elisions naturally rather than mechanically reciting disconnected syllables.

---

## 5. Unicode Normalization: NFC Standard
A critical failure of generic NLP models on Yoruba is accent fragmentation.
In Unicode, a character like `ọ́` can be represented in two ways:

1. **NFD (Decomposed):** `o` + `\u0323` (combining dot below) + `\u0301` (combining acute). (3 separate code points!).
2. **NFC (Composed / Canonical):** `ọ́` represented as a unified precomposed character or clean base + combining mark.

> **PROJECT RULE:** All incoming text, datasets, and transcriptions must be normalized to **Unicode NFC** (`unicodedata.normalize('NFC', text)`) before tokenization or model ingestion.
