from typing import List, Dict, Any
from pydantic import BaseModel

class DailyTrendItem(BaseModel):
    date: str
    total_generations: int
    completed_generations: int
    failed_generations: int
    characters_processed: int
    duration_seconds: float

class LanguageUsageItem(BaseModel):
    language_code: str
    language_name: str
    count: int
    total_duration: float
    percentage: float

class AnalyticsOverviewResponse(BaseModel):
    total_volume: int
    total_duration_hours: float
    total_characters: int
    average_duration_seconds: float
    overall_success_rate: float
    active_languages_count: int
    daily_trends: List[DailyTrendItem]
    language_usage: List[LanguageUsageItem]
    model_usage: List[Dict[str, Any]]
