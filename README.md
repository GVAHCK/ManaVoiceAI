# ManaVoice AI — Multilingual AI Text-to-Speech Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19_Vite-brightgreen.svg)](https://react.dev/)
[![Hugging Face](https://img.shields.io/badge/AI_Engine-Meta_MMS_VITS-yellow.svg)](https://huggingface.co/facebook/mms-tts-eng)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_7.0-green.svg)](https://www.mongodb.com/)

ManaVoice AI is a full-stack, secure, production-grade text-to-speech platform that converts text into natural-sounding speech across multiple languages. It combines real-time translation, neural speech synthesis via Hugging Face Transformers and PyTorch, persistent MongoDB storage, and a dashboard styled strictly with the approved 5-color ManaVoice visual identity.

---

## 1. Brand Identity & Strict Color Palette

The entire platform exclusively adheres to the 5 approved brand colors across all pages, charts, components, and controls:

| Color Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **Midnight Navy** | `#17252A` | Primary dark surfaces, navigation background, brand contrast |
| **Deep Teal** | `#2B7A78` | Secondary surfaces, borders, secondary emphasis, icons |
| **Mana Teal** | `#3AAFA9` | Primary brand color, primary buttons, accents, highlights |
| **Mist Mint** | `#DEF2F1` | Light backgrounds, cards, subtle contrast areas, inputs |
| **Pure White** | `#FFFFFF` | Main light content surfaces, readable text on dark surfaces |

- **Exclusive Icon Library:** `bootstrap-icons` (no other icon library or inline shapes are permitted).
- **Typography:** `Inter` (Google Fonts) with monospace support.

---

## 2. Architecture & Technology Stack

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **Routing:** React Router v7
- **CSS Architecture:** Vanilla CSS design tokens (`tokens.css`, `global.css`) overriding Bootstrap 5 utilities
- **Icons:** Bootstrap Icons (`bi bi-*`)
- **Visualizations:** Recharts (strictly styled with approved brand palette)
- **HTTP Client:** Axios with JWT request and response interceptors

### Backend
- **Framework:** Python 3.11+ / FastAPI
- **Server:** Uvicorn (ASGI)
- **Validation:** Pydantic v2 & Pydantic-Settings
- **Security:** JWT (python-jose) + native `bcrypt` password hashing
- **Database:** MongoDB via `motor` (asynchronous PyMongo driver) with automatic `mongomock_motor` fallback for offline development & isolated testing
- **Inference Engine:** Hugging Face Transformers + PyTorch (`VitsModel` & `VitsTokenizer`)
- **Audio Output:** SoundFile (16,000 Hz, uncompressed 16-bit PCM WAV)
- **Storage:** Local filesystem adapter with strict path traversal validation

---

## 3. Supported Languages & Model Registry

| Language Code | Language Name | Neural Model Checkpoint | License | Readiness |
| :--- | :--- | :--- | :--- | :--- |
| `en` | English | `facebook/mms-tts-eng` | CC-BY-NC 4.0 | Verified & Cached |
| `es` | Spanish | `facebook/mms-tts-spa` | CC-BY-NC 4.0 | Supported |
| `fr` | French | `facebook/mms-tts-fra` | CC-BY-NC 4.0 | Supported |
| `de` | German | `facebook/mms-tts-deu` | CC-BY-NC 4.0 | Supported |
| `hi` | Hindi | `facebook/mms-tts-hin` | CC-BY-NC 4.0 | Supported |
| `te` | Telugu | `facebook/mms-tts-tel` | CC-BY-NC 4.0 | Supported |

> **Model Licensing Notice:** Meta MMS checkpoints are distributed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC-BY-NC 4.0)** license. For commercial production deployments, verify license permissions or integrate authorized commercial TTS checkpoints.

---

## 4. API Endpoints Reference

### Health Probes
- `GET /health/live` — Liveness probe
- `GET /health/ready` — Readiness probe (database connectivity + TTS engine status)

### Authentication
- `POST /api/v1/auth/register` — Register a new account
- `POST /api/v1/auth/login` — Sign in and obtain JWT access & refresh tokens
- `POST /api/v1/auth/refresh` — Refresh access token
- `POST /api/v1/auth/logout` — Invalidate user session
- `GET /api/v1/auth/me` — Retrieve current authenticated user profile

### User Preferences
- `GET /api/v1/users/me` — Get user profile & defaults
- `PATCH /api/v1/users/me` — Update display name, preferred languages, or password
- `DELETE /api/v1/users/me` — Delete user account and associated audio data

### Speech & Translation
- `GET /api/v1/languages` — Catalog of supported languages, checkpoints, and readiness
- `POST /api/v1/speech/translate` — Translate text between supported languages
- `POST /api/v1/speech/generate` — Synthesize speech with Transformers & persist in MongoDB
- `GET /api/v1/speech/{generation_id}` — Get generation details and status
- `GET /api/v1/speech/{generation_id}/audio` — Stream or download generated WAV audio
- `POST /api/v1/speech/{generation_id}/retry` — Retry a failed generation
- `DELETE /api/v1/speech/{generation_id}` — Delete generation and audio file

### Dashboard & Analytics
- `GET /api/v1/dashboard/summary` — 6 core metrics (Total, Successful, Duration, Characters, Languages, Success Rate)
- `GET /api/v1/dashboard/activity?days={7|30|90}` — Daily generation counts for charts
- `GET /api/v1/dashboard/language-distribution` — Target language distribution
- `GET /api/v1/dashboard/recent-generations` — Latest generation records
- `GET /api/v1/dashboard/usage` — Monthly usage metrics
- `GET /api/v1/analytics/overview?days={30}` — Detailed trends, duration hours, and model stats

### History & Saved Audio
- `GET /api/v1/history` — Paginated history with search, language, status, and sort filters
- `GET /api/v1/history/{generation_id}` — Record details
- `DELETE /api/v1/history/{generation_id}` — Remove record
- `GET /api/v1/saved-audio` — List bookmarked audio recordings
- `POST /api/v1/saved-audio/{generation_id}` — Bookmark recording
- `DELETE /api/v1/saved-audio/{generation_id}` — Remove bookmark

### Public Pages & Legal Documentation
- `/` — Homepage (Sections A through M)
- `/privacy` — Comprehensive privacy disclosure & audio retention policy
- `/terms` — Terms of service & Meta MMS CC-BY-NC 4.0 license attribution

---

## 5. Production Readiness & Persistence Architecture

- **Zero Silent Fallback in Production:** In production mode (`ENVIRONMENT=production` or `ALLOW_MOCK_DB=false`), the application strictly refuses silent degradation to volatile in-memory storage. If persistent MongoDB is unavailable, `/health/ready` returns HTTP 503 `unhealthy`.
- **User Ownership Isolation:** All queries for generations, audio files, bookmarking, and deletion are scoped with compound indexes on `{ user_id: 1, ... }`. Cross-user access returns HTTP 404.
- **Audio File Lifecycle:** Audio binaries are stored on filesystem storage or object storage using UUID keys and validated against path-traversal attacks. Deleting a record triggers removal from storage and database.


## 6. Local Development Startup Instructions

### Prerequisites
- Node.js v18+ and npm
- Python 3.11+
- Optional: MongoDB 7.0 (or run containerized via Docker)

### Backend Setup (PowerShell on Windows)
```powershell
# Navigate to backend directory
cd backend

# Create .env from template
Copy-Item .env.example .env

# Run FastAPI backend with Uvicorn
$env:PYTHONPATH="."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup (PowerShell on Windows)
```powershell
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 7. Docker Compose Deployment

To run the entire full-stack application (Frontend + Backend + MongoDB + LibreTranslate):

```bash
docker-compose up -d --build
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **MongoDB:** `localhost:27017`
- **LibreTranslate:** `localhost:5000`

---

## 8. Automated Testing & End-to-End Verification

### Backend Unit & Integration Tests (13 Suites)
```powershell
$env:PYTHONPATH="backend"
python -m pytest backend/tests/test_backend.py -v
```

### Frontend TypeScript & Production Build Verification
```powershell
cd frontend
npm run build
```
Build output is generated into `frontend/dist/` with 0 TypeScript or bundling errors.
