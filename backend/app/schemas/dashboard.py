from typing import List, Optional
from pydantic import BaseModel
from app.schemas.speech import GenerationResponse

class MetricCardData(BaseModel):
    value: float
    formatted: str
    change_pct: Optional[float] = None
    subtext: str

class DashboardSummaryResponse(BaseModel):
    total_generations: MetricCardData
    successful_generations: MetricCardData
    total_audio_duration_seconds: MetricCardData
    characters_processed: MetricCardData
    languages_used: MetricCardData
    success_rate_pct: MetricCardData

class ActivityDataPoint(BaseModel):
    date: str
    count: int
    success_count: int
    duration_seconds: float

class LanguageDataPoint(BaseModel):
    language: str
    name: str
    count: int
    percentage: float

class StatusDataPoint(BaseModel):
    status: str
    count: int
    color: str

class DashboardUsageResponse(BaseModel):
    generations_this_month: int
    characters_this_month: int
    audio_seconds_this_month: float
