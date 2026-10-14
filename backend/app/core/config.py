import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent

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
    HF_HOME: str = str(BASE_DIR / ".cache" / "huggingface")

    # Translation
    TRANSLATION_PROVIDER: str = "libretranslate"
    LIBRETRANSLATE_URL: str = "https://libretranslate.com"
    LIBRETRANSLATE_API_KEY: str = ""
    TRANSLATION_TIMEOUT_SECONDS: int = 30

    # Storage
    STORAGE_PROVIDER: str = "local"
    AUDIO_STORAGE_DIR: str = str(BASE_DIR / "storage" / "audio")

    # Limits
    MAX_TEXT_LENGTH: int = 3000
    MAX_CONCURRENT_GENERATIONS: int = 2
    REQUEST_TIMEOUT_SECONDS: int = 120

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
