from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=3000)
    source_language: str
    target_language: str

class TranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    provider: str

class GenerateSpeechRequest(BaseModel):
    original_text: str = Field(min_length=1, max_length=3000)
    translated_text: Optional[str] = None
    source_language: str = "en"
    target_language: str = "en"
    model_id: Optional[str] = "facebook/mms-tts-eng"
    voice_id: Optional[str] = "default"
    speaking_rate: Optional[float] = Field(default=1.0, ge=0.5, le=2.0)

class GenerationResponse(BaseModel):
    id: str
    user_id: str
    original_text: str
    translated_text: Optional[str] = None
    source_language: str
    target_language: str
    translation_provider: Optional[str] = None
    tts_provider: str
    model_id: str
    voice_id: Optional[str] = None
    status: str
    error_code: Optional[str] = None
    error_message_safe: Optional[str] = None
    audio_url: Optional[str] = None
    audio_format: str
    sample_rate: int
    duration_seconds: float
    file_size_bytes: int
    character_count: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    is_saved: Optional[bool] = False
