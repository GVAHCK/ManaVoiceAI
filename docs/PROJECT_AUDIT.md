# ManaVoice AI — Comprehensive Project Audit

**Date of Audit:** October 18, 2026  
**Auditor:** Principal ML Engineer & Systems Architect  
**Project:** ManaVoice AI (Multilingual Video Localization, Voice Synthesis & Lip-Sync Platform)

---

## 1. Executive Summary & Baseline

ManaVoice AI began as a full-stack text-to-speech platform built with FastAPI, React 19, MongoDB, and Hugging Face Transformers (`facebook/mms-tts-*`). The baseline application was verified and confirmed fully operational:
- **Backend Test Suite:** 13 out of 13 tests passing in `tests/test_backend.py` (1.65s execution time).
- **Frontend Production Build:** `tsc -b && vite build` completed with zero TypeScript errors and zero compilation warnings.
- **Brand Visual Identity:** Strict 5-color palette:
  - Midnight Navy: `#17252A`
  - Deep Teal: `#2B7A78`
  - Mana Teal: `#3AAFA9`
  - Mist Mint: `#DEF2F1`
  - Pure White: `#FFFFFF`
  - Exclusively using Bootstrap Icons (`bi bi-*`) and Inter typography.

This audit documents the current repository state, hardware capabilities, available pretrained weights, and the delta required to transform the platform into a production-oriented, ML-powered multilingual audio/video translation, voice synthesis, and lip-sync platform.

---

## 2. Hardware & Environment Specifications

The following hardware and runtime parameters were directly verified on the host system:

| Component | Specification | Observed Status |
| :--- | :--- | :--- |
| **Operating System** | Windows 11 64-bit | Active |
| **CPU** | 13th Gen Intel Core i5-13420H | 8 Cores (4P + 4E), 12 Logical Processors |
| **System Memory (RAM)** | 16 GB DDR5 | 15.71 GB Visible, ~3.12 GB Free Physical |
| **GPU** | NVIDIA GeForce RTX 3050 Laptop GPU | 6144 MiB (6 GB VRAM), Bus 01:00.0, WDDM |
| **NVIDIA Driver / CUDA** | Driver 546.18 / CUDA 12.3 Support | Operational |
| **Python Runtime** | Python 3.14.7 (Windows x86-64) | Active (`py -3`) |
| **PyTorch Wheel** | PyTorch 2.14.1+cpu | Operational (CPU execution; CUDA fallback ready) |
| **Node.js / npm** | Node.js v24.16.0 / npm 11.x | Operational |
| **FFmpeg Media Engine** | FFmpeg 9.0.1-essentials (gyan.dev MSYS2 build) | Operational on system PATH |
| **Disk Storage (Drive C:)** | NTFS Local SSD (182.7 GB Total) | ~305 MB Free (Capacity constrained) |
| **Disk Storage (Drive D:)** | NTFS Local Volume (146.5 GB Total) | **123.92 GB Free** (Ideal for ML/Storage) |
| **Disk Storage (Drive E:)** | NTFS Local Volume (146.5 GB Total) | **129.05 GB Free** (Ideal for Datasets) |

> **Critical Storage Policy:** Because Drive C: has ~305 MB available while Drives D: and E: have over 120 GB free each, all heavy storage directories (large media uploads, model checkpoints, dataset cache, and video render scratches) must feature disk-space pre-checks and dynamic drive offloading/configuration via `.env`.

---

## 3. Directory Structure & Inventory

```
ManaVoice/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py                  # JWT Auth & DB dependencies
│   │   │   └── routes/
│   │   │       ├── analytics.py         # Usage analytics & trends
│   │   │       ├── auth.py              # Login, register, refresh, me
│   │   │       ├── dashboard.py         # Dashboard metrics & language distribution
│   │   │       ├── health.py            # /health/live and /health/ready probes
│   │   │       ├── history.py           # Paginated generation history & deletion
│   │   │       ├── languages.py         # Supported languages & model registry
│   │   │       ├── saved_audio.py       # Audio bookmarks
│   │   │       ├── speech.py            # TTS generation & translation endpoints
│   │   │       └── users.py             # User profile preferences
│   │   ├── core/
│   │   │   ├── config.py                # Pydantic BaseSettings & environment configs
│   │   │   ├── logging.py               # Structured logging
│   │   │   └── security.py              # JWT generation, bcrypt password hashing
│   │   ├── db/
│   │   │   ├── indexes.py               # MongoDB compound indexes
│   │   │   └── mongodb.py               # Motor async client & mongomock-motor fallback
│   │   ├── models/
│   │   │   ├── generation.py            # GenerationModel schema
│   │   │   └── user.py                  # UserModel schema
│   │   ├── repositories/
│   │   │   ├── base.py                  # Base Mongo repository
│   │   │   ├── generation_repository.py # Generation CRUD operations
│   │   │   └── user_repository.py       # User CRUD operations
│   │   ├── schemas/
│   │   │   ├── analytics.py
│   │   │   ├── auth.py
│   │   │   ├── dashboard.py
│   │   │   ├── language.py
│   │   │   ├── speech.py
│   │   │   └── user.py
│   │   ├── services/
│   │   │   ├── storage_service.py       # Local file storage with path-traversal prevention
│   │   │   ├── translation_service.py   # LibreTranslate client + offline fallback dict
│   │   │   └── tts_service.py           # Meta MMS VITS model loader & inference
│   │   └── main.py                      # FastAPI app entry point & middlewares
│   ├── storage/                         # Local audio storage
│   ├── tests/
│   │   ├── conftest.py                  # Pytest fixtures & mock database
│   │   └── test_backend.py              # 13 backend unit/integration tests
│   ├── .env                             # Environment configuration
│   ├── .env.example                     # Environment template
│   ├── Dockerfile                       # Backend containerization
│   └── requirements.txt                 # Backend dependencies
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/                      # Icons and static media
│   │   ├── components/                  # Navbar, Sidebar, Footer, AudioPlayer, etc.
│   │   ├── contexts/                    # AuthContext (JWT auth state)
│   │   ├── pages/
│   │   │   ├── AnalyticsPage.tsx        # Charts & statistics
│   │   │   ├── DashboardPage.tsx        # Overview dashboard
│   │   │   ├── HistoryPage.tsx          # Generation history & search
│   │   │   ├── LandingPage.tsx          # Full marketing homepage
│   │   │   ├── LanguagesPage.tsx        # Language catalog & model status
│   │   │   ├── LoginPage.tsx            # Login form
│   │   │   ├── RegisterPage.tsx         # Registration form
│   │   │   ├── SavedAudioPage.tsx       # Bookmarked audio
│   │   │   ├── SettingsPage.tsx         # Account preferences
│   │   │   ├── StudioPage.tsx           # Existing TTS synthesis studio
│   │   │   ├── PrivacyPage.tsx          # Privacy policy
│   │   │   └── TermsPage.tsx            # Terms of service
│   │   ├── services/                    # Axios API clients
│   │   ├── styles/                      # tokens.css, global.css
│   │   ├── types/                       # TypeScript interfaces
│   │   ├── App.tsx                      # React Router routes
│   │   └── main.tsx                     # Entry point
│   ├── package.json                     # React 19, Vite, Recharts, Bootstrap
│   ├── tsconfig.json                    # TypeScript configuration
│   └── vite.config.ts                   # Vite build configuration
├── docker-compose.yml                   # Docker Compose definition
└── README.md                            # Project documentation
```

---

## 4. Existing Pretrained Models & Model Cache

Inspection of the host Hugging Face cache at `C:\Users\venka\.cache\huggingface\hub` revealed pre-cached weights:

1. **`facebook/mms-tts-eng`**: Meta MMS VITS English text-to-speech model. License: CC-BY-NC 4.0.
2. **`openai/whisper-large-v3-turbo`**: OpenAI Whisper Large v3 Turbo checkpoint. License: MIT.
3. **`mobiuslabsgmbh/faster-whisper-large-v3-turbo`**: CTranslate2-optimized Whisper weights. License: MIT.

---

## 5. Architectural Gap Analysis

To meet the complete specifications of the Master Engineering Prompt, the following components must be created or augmented:

| Area | Existing State | Required Target State |
| :--- | :--- | :--- |
| **Media Pipeline** | Only uncompressed WAV generation supported | Ingestion of MP4, MOV, MKV, WebM, audio extraction, frame sampling, background-audio demuxing & remixing, FFmpeg rendering. |
| **Speech Recognition (ASR)** | None | Multilingual ASR service using Whisper architecture with timestamped segments, language detection, confidence scores, and forced alignment. |
| **Translation Engine** | LibreTranslate HTTP + 5-phrase dictionary | Robust Multilingual Machine Translation service supporting sentence chunking, punctuation normalization, glossary, Indian languages (Hindi, Telugu, Tamil, etc.), and quality scoring. |
| **Voice Synthesis & Dubbing** | Meta MMS VITS (single voice per lang) | Multi-voice neural synthesis, segment-level generation, speaking rate adjustment, segment timing fit (atempo/time-stretch without drift), licensed voice presets. |
| **Speaker Diarization** | None | Multi-speaker segmentation, speaker ID tracking, speaker-to-target-voice assignment. |
| **Lip-Sync & Face Motion** | None | Audio-driven lip-sync pipeline (Wav2Lip architecture adapter), face detection, mouth region synchronization, graceful degradation report when disabled/inapplicable. |
| **Subtitles** | None | WebVTT (`.vtt`) and SubRip (`.srt`) generators with precise timecode formatting. |
| **Video Reconstruction** | None | Video frame reassembly, audio replacement, background track mixing, subtitle burn-in/packaging, MP4 export. |
| **Kaggle API & Datasets** | None | Kaggle API/CLI integration, discovery, download manager with disk-space protection, dataset manifest (`configs/datasets.yaml`), and data cleaning/splitting pipeline. |
| **Model Fine-Tuning** | None | Reproducible ML training pipeline (ASR/Translation/TTS fine-tuning, training profiles, LoRA support, validation metrics, checkpoint registry). |
| **Evaluation Framework** | None | Quantitative evaluation suite: WER/CER for ASR, BLEU/chrF for Translation, latency/RTF for TTS, lip-sync confidence for video. |
| **Background Processing** | Synchronous HTTP calls only | Asynchronous background worker orchestration for media processing, translation jobs, training runs, with real-time progress reporting. |
| **Frontend User Experience** | Audio TTS only (StudioPage) | Mode A (Audio & Text Translation Studio), Mode B (Complete Video Localization Studio), Interactive Transcript & Subtitle Editor, Voice Studio, Processing Dashboard with stage status, Export Center, Dataset & Model Management, Model Evaluation Dashboard. |

---

## 6. Audit Conclusion & Approval

The ManaVoice codebase has a clean modular structure, clear separation of concerns, and robust error handling. Upgrading it to support full end-to-end multilingual video translation, voice synthesis, and lip-sync will preserve all existing functionality while adding the ML and media services required.
