import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent

def _resolve_default_storage() -> Path:
    # If D:\ManaVoice_Data exists or D: drive has large capacity, prioritize it to protect C: drive
    d_path = Path("D:/ManaVoice_Data")
    if d_path.exists():
        return d_path
    return BASE_DIR / "storage"

class Settings(BaseSettings):
    APP_NAME: str = "ManaVoice AI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"

    # Database
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "manavoice_ai"
    MONGODB_TIMEOUT_MS: int = 2000

    # JWT Authentication
    JWT_SECRET_KEY: str = "mana_voice_super_secret_jwt_key_2026_antigravity_token_secure_random"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_MINUTES: int = 60
    JWT_REFRESH_TOKEN_DAYS: int = 7

    # CORS
    FRONTEND_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    # Text-to-Speech
    TTS_PROVIDER: str = "transformers"
    TTS_MODEL_DEFAULT: str = "facebook/mms-tts-eng"
    DEVICE: str = "cpu"
    HF_HOME: str = str(_resolve_default_storage() / "cache" / "huggingface")
    TRANSFORMERS_CACHE: str = str(_resolve_default_storage() / "cache" / "huggingface" / "hub")
    PIP_CACHE_DIR: str = str(_resolve_default_storage() / "cache" / "pip")
    TORCH_HOME: str = str(_resolve_default_storage() / "cache" / "torch")

    # Speech Recognition (ASR)
    ASR_PROVIDER: str = "whisper"
    ASR_MODEL_DEFAULT: str = "openai/whisper-large-v3-turbo"
    ASR_DEVICE: str = "cpu"

    # Translation
    TRANSLATION_PROVIDER: str = "libretranslate"
    LIBRETRANSLATE_URL: str = "https://libretranslate.com"
    LIBRETRANSLATE_API_KEY: str = ""
    TRANSLATION_TIMEOUT_SECONDS: int = 30

    # Lip-Sync & Face Processing
    LIPSYNC_ENABLED: bool = True
    LIPSYNC_MODEL_ID: str = "wav2lip"

    # Storage Paths & Volumes
    STORAGE_PROVIDER: str = "local"
    BASE_STORAGE_DIR: str = str(_resolve_default_storage())
    AUDIO_STORAGE_DIR: str = str(Path(BASE_STORAGE_DIR) / "audio")
    MEDIA_STORAGE_DIR: str = str(Path(BASE_STORAGE_DIR) / "media")
    VIDEO_STORAGE_DIR: str = str(Path(BASE_STORAGE_DIR) / "video")
    SUBTITLE_STORAGE_DIR: str = str(Path(BASE_STORAGE_DIR) / "subtitles")
    DATASET_STORAGE_DIR: str = str(Path(BASE_STORAGE_DIR) / "datasets")
    MODELS_STORAGE_DIR: str = str(Path(BASE_STORAGE_DIR) / "models")
    SCRATCH_STORAGE_DIR: str = str(Path(BASE_STORAGE_DIR) / "scratch")


    # Disk Space Protection
    MIN_FREE_DISK_MB: int = 150  # Refuse downloads or large tasks if disk drops below this


    # Kaggle Integration
    KAGGLE_USERNAME: str = ""
    KAGGLE_KEY: str = ""
    DATASET_REGISTRY_PATH: str = str(BASE_DIR.parent / "configs" / "datasets.yaml")

    # Media & Upload Limits
    MAX_TEXT_LENGTH: int = 5000
    MAX_MEDIA_FILE_SIZE_MB: int = 100
    MAX_VIDEO_DURATION_SECONDS: int = 900
    MAX_CONCURRENT_GENERATIONS: int = 2
    REQUEST_TIMEOUT_SECONDS: int = 300

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.FRONTEND_ORIGINS.split(",") if origin.strip()]

    # Security & Controls
    ALLOW_MOCK_DB: bool = True  # Strict: Disabled in production mode
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 15

    model_config = {
        "env_file": str(BASE_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

settings = Settings()

