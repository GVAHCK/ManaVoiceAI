from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from app.schemas.analytics import AnalyticsOverviewResponse, DailyTrendItem, LanguageUsageItem
from app.repositories.generation_repository import GenerationRepository
from app.api.deps import get_generation_repository, get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(
    days: int = Query(default=30, ge=7, le=90),
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
):
    user_id = current_user["id"]
    metrics = await gen_repo.get_summary_metrics(user_id)
    daily_items = await gen_repo.get_daily_activity(user_id, days=days)
    lang_items = await gen_repo.get_language_distribution(user_id)

    total_vol = metrics["total_generations"]
    total_dur_sec = metrics["total_duration"]
    total_chars = metrics["total_characters"]
    dur_hours = round(total_dur_sec / 3600.0, 2)
    avg_dur = round(total_dur_sec / total_vol, 2) if total_vol > 0 else 0.0

    daily_trends = [
        DailyTrendItem(
            date=item["date"],
            total_generations=item["count"],
            completed_generations=item["success_count"],
            failed_generations=item["failed_count"],
            characters_processed=item["characters"],
            duration_seconds=round(item["duration_seconds"], 1),
        )
        for item in daily_items
    ]

    language_usage = [
        LanguageUsageItem(
            language_code=item["language"],
            language_name=item["name"],
            count=item["count"],
            total_duration=item["duration"],
            percentage=item["percentage"],
        )
        for item in lang_items
    ]

    model_usage = [
        {"model_id": "facebook/mms-tts-eng", "count": total_vol, "status": "active"}
    ]

    return AnalyticsOverviewResponse(
        total_volume=total_vol,
        total_duration_hours=dur_hours,
        total_characters=total_chars,
        average_duration_seconds=avg_dur,
        overall_success_rate=metrics["success_rate"],
        active_languages_count=metrics["languages_used_count"],
        daily_trends=daily_trends,
        language_usage=language_usage,
        model_usage=model_usage,
    )

@router.get("/generations", response_model=List[DailyTrendItem])
async def get_generation_trends(
    days: int = Query(default=30, ge=7, le=90),
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
):
    user_id = current_user["id"]
    daily_items = await gen_repo.get_daily_activity(user_id, days=days)
    return [
        DailyTrendItem(
            date=item["date"],
            total_generations=item["count"],
            completed_generations=item["success_count"],
            failed_generations=item["failed_count"],
            characters_processed=item["characters"],
            duration_seconds=round(item["duration_seconds"], 1),
        )
        for item in daily_items
    ]

@router.get("/languages", response_model=List[LanguageUsageItem])
async def get_language_trends(
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
):
    user_id = current_user["id"]
    lang_items = await gen_repo.get_language_distribution(user_id)
    return [
        LanguageUsageItem(
            language_code=item["language"],
            language_name=item["name"],
            count=item["count"],
            total_duration=item["duration"],
            percentage=item["percentage"],
        )
        for item in lang_items
    ]
