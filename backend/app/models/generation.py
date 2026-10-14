from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class GenerationModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    original_text: str
    translated_text: Optional[str] = None
    source_language: str = "en"
    target_language: str = "en"
    translation_provider: Optional[str] = None
    tts_provider: str = "transformers"
    model_id: str = "facebook/mms-tts-eng"
    voice_id: Optional[str] = "default"
    status: str = "pending"  # pending, completed, failed
    error_code: Optional[str] = None
    error_message_safe: Optional[str] = None
    audio_storage_key: Optional[str] = None
    audio_format: str = "wav"
    audio_mime_type: str = "audio/wav"
    sample_rate: int = 16000
    duration_seconds: float = 0.0
    file_size_bytes: int = 0
    character_count: int = 0
    request_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)
