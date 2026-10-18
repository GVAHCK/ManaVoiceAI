# ManaVoice AI — Production Deployment & Operations Guide

This document describes the deployment architecture, system requirements, environment configurations, and operational procedures for running ManaVoice AI in local, workstation, and production cloud environments.

---

## 1. System Requirements & Hardware Guidelines

| Resource | Minimum (Development) | Recommended (Production Workstation) | High-Throughput Cluster |
|---|---|---|---|
| **CPU** | 4 Cores (x86_64) | 8–12 Cores (Intel Core i5/i7 13th Gen+) | 16+ Cores AMD EPYC / Intel Xeon |
| **RAM** | 8 GB DDR4 | 16 GB DDR5 | 32–64 GB ECC |
| **GPU** | CPU Fallback Enabled | NVIDIA RTX 3050/4060 (6GB–8GB VRAM) | NVIDIA RTX 4090 / A100 (24GB–80GB) |
| **Storage (System)** | 50 GB SSD (Drive C:) | 100 GB NVMe | 250 GB NVMe |
| **Storage (Media/ML)**| 100 GB (Drive D:) | 500 GB+ High-Speed SSD | 2 TB+ NVMe / S3 Bucket |
| **OS** | Windows 11 / Ubuntu 22.04 LTS | Windows 11 / Ubuntu 22.04 LTS | Ubuntu 22.04 LTS / Debian 12 |
| **Software** | Python 3.10–3.14, Node 20+, FFmpeg | Python 3.11–3.14, Node 20+, FFmpeg 6+ | Python 3.11, Node 20+, CUDA 12.3+ |

---

## 2. Multi-Drive Storage Architecture

To prevent system disk starvation (such as when Drive C: drops below safe operating margins), ManaVoice AI implements an automated storage redirection layer in `app/services/storage_service.py`:

```text
D:/ManaVoice_Data/
├── audio/          # Synthesized WAV clips and processed tracks
├── media/          # Ingested user videos and audio uploads
├── video/          # Rendered translated MP4 outputs
├── subtitles/      # Generated SRT and WebVTT subtitle files
├── datasets/       # Kaggle and HuggingFace acquired corpora
├── models/         # Registered checkpoints and LoRA adapters
├── scratch/        # Temporary frame extractions and intermediate clips
└── evaluations/    # Machine-readable JSON evaluation benchmarks
```

---

## 3. Environment Configuration

Copy `backend/.env.example` to `backend/.env` and update the parameters:

```env
# Application Settings
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=generate-a-strong-random-64-character-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database
DATABASE_URL=mongodb://localhost:27017
DATABASE_NAME=manavoice

# Storage & Large Files (Points to secondary high-capacity drive)
STORAGE_DIR=D:/ManaVoice_Data
MAX_FILE_SIZE_MB=500
MAX_VIDEO_DURATION_SECONDS=1800

# Compute & Device
DEVICE=cuda                     # Set to 'cpu' if no dedicated GPU
OPENBLAS_NUM_THREADS=1          # Crucial for preventing BLAS memory fragmentation on Windows
MAX_CONCURRENT_GENERATIONS=3

# MLOps & Kaggle Integration
KAGGLE_USERNAME=your_kaggle_username
KAGGLE_KEY=your_kaggle_api_token
KAGGLE_CONFIG_DIR=D:/ManaVoice_Data/.kaggle
```

---

## 4. Application Startup Procedures

### A. Backend FastAPI Server
Navigate to `backend/` and start Uvicorn:

```powershell
# Windows PowerShell
cd c:\Users\venka\OneDrive\Desktop\ManaVoice\backend
$env:OPENBLAS_NUM_THREADS="1"
py -3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

```bash
# Linux / macOS
cd backend
export OPENBLAS_NUM_THREADS=1
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### B. Frontend Vite Application
Navigate to `frontend/` and launch the client interface:

```powershell
cd c:\Users\venka\OneDrive\Desktop\ManaVoice\frontend
# Development Server
npm run dev

# Production Build & Preview
npm run build
npm run preview -- --port 5173
```

---

## 5. Docker & Containerized Deployment

A production `Dockerfile` for GPU-accelerated container environments:

```dockerfile
# Backend Dockerfile
FROM nvidia/cuda:12.3.1-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    ffmpeg \
    libsndfile1 \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

ENV OPENBLAS_NUM_THREADS=1
ENV STORAGE_DIR=/data

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Launching with Docker Compose:
```bash
docker compose up -d --build
```
Ensure NVIDIA Container Toolkit is installed to enable GPU passthrough (`--gpus all`).
