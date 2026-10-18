# ManaVoice AI — Multilingual Dataset Guide & Kaggle Integration

## 1. Dataset Discovery & Acquisition Overview

ManaVoice AI includes an authenticated, storage-aware dataset acquisition and preprocessing pipeline integrated directly with the official Kaggle API and Hugging Face Datasets.

All datasets are version-pinned and registered in the centralized catalog at:
`configs/datasets.yaml`

---

## 2. Curated Benchmark Datasets

| Dataset Identifier | Task | Languages | License | Approx. Size | Preprocessing Pipeline |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`google/fleurs`** | Multilingual ASR & Evaluation | `en`, `hi`, `te`, `ta`, `kn`, `ml`, `bn`, `mr`, `es`, `fr`, `de` | CC-BY 4.0 | 450 MB | 16 kHz mono resampling, silence trimming, Unicode text normalization. |
| **`mozillaorg/common-voice`** | ASR & Voice Research | `en`, `hi`, `te`, `ta`, `mr`, `es`, `fr`, `de` | CC0 1.0 | 1.2 GB | Duration filtering (3–15s), empty transcript filtering, audio verification. |
| **`ai4bharat/indic-speech`** | Indian TTS & ASR | `hi`, `te`, `ta`, `kn`, `ml`, `bn`, `mr` | MIT | 680 MB | Phoneme alignment, loudness normalization to -16 LUFS, quality scoring. |
| **`opus/multilingual-subtitles`** | Machine Translation | `en`, `es`, `fr`, `de`, `hi`, `te`, `ta` | CC-BY-SA 4.0 | 85 MB | Sentence deduplication, length-ratio filtering (0.5–2.0), punctuation normalization. |
| **`oxford/lrs3-ted-speech`** | Lip-Sync & Face Motion | `en` | Academic Research | 890 MB | Face/mouth bounding box crop (96x96), 80-band Mel-spectrogram extraction, 25 FPS sync. |

---

## 3. Kaggle API Configuration & Authentication

To search and download datasets live using the official Kaggle API:

1. Obtain your API credentials from [Kaggle Account Settings](https://www.kaggle.com/settings).
2. Configure them in `backend/.env`:
   ```bash
   KAGGLE_USERNAME=your_kaggle_username
   KAGGLE_KEY=your_kaggle_api_key
   ```
   *Alternatively, place your token at `~/.kaggle/kaggle.json`.*
3. **Security Guarantee:** Credentials are never logged, committed to version control, or exposed over public API routes.

---

## 4. Storage-Aware Acquisition Planner

Because local machines may have constrained primary storage (e.g. Drive C:), the platform features proactive disk space guards:
- **Pre-Download Capacity Check:** Automatically verifies that `free_disk_mb >= (dataset_size_mb + MIN_FREE_DISK_MB)`.
- **High-Capacity Volume Offloading:** Seamlessly stores dataset binaries on secondary drives (e.g. `D:/ManaVoice_Data/datasets`).
- **Reproducible Manifest Generation:** Creates a standardized `manifest.json` with train, validation, and test splits ensuring zero speaker leakage.
