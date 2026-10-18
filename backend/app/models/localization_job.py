from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class TimelineSegment(BaseModel):
    id: int
    start: float
    end: float
    text: str
    original_text: Optional[str] = None
    translated_text: Optional[str] = None
    speaker: str = "SPEAKER_00"
    voice_id: Optional[str] = "default"
    confidence: float = 0.95
    words: Optional[List[Dict[str, Any]]] = None

    model_config = ConfigDict(populate_by_name=True)

class LocalizationJobModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    job_type: str = "video_localization"  # "video_localization" or "audio_translation"
    status: str = "pending"  # pending, processing, completed, failed, cancelled
    current_stage: str = "queued"  # queued, ingestion, extraction, transcription, translation, synthesis, lipsync, rendering, completed
    stage_progress_pct: int = 0
    source_language: str = "en"
    target_language: str = "es"

    # Source Media Metadata
    source_media_storage_key: str
    source_filename: str
    source_duration_seconds: float = 0.0
    has_video: bool = True
    video_width: Optional[int] = None
    video_height: Optional[int] = None
    video_fps: Optional[float] = None

    # Pipeline Settings
    enable_lipsync: bool = True
    burn_subtitles: bool = False
    speech_volume: float = 1.0
    background_volume: float = 0.25
    speaking_rate: float = 1.0

    # Transcript & Timeline
    segments: List[TimelineSegment] = Field(default_factory=list)

    # Lip-Sync Results
    lipsync_applied: bool = False
    lipsync_status: Optional[str] = None  # applied, completed_without_lipsync, completed_audio_only
    lipsync_confidence: Optional[float] = None
    faces_detected_count: int = 0

    # Rendered Output Artifacts
    output_video_storage_key: Optional[str] = None
    output_audio_storage_key: Optional[str] = None
    output_srt_storage_key: Optional[str] = None
    output_vtt_storage_key: Optional[str] = None

    # Execution Logs and Diagnostics
    processing_logs: List[str] = Field(default_factory=list)
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)
