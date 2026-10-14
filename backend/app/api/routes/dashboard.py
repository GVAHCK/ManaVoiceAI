from typing import List
from fastapi import APIRouter, Depends, Query
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    MetricCardData,
    ActivityDataPoint,
    LanguageDataPoint,
    StatusDataPoint,
    DashboardUsageResponse,
)
from app.schemas.speech import GenerationResponse
from app.repositories.generation_repository import GenerationRepository
from app.repositories.saved_audio_repository import SavedAudioRepository
from app.api.deps import (
    get_generation_repository,
    get_saved_audio_repository,
    get_current_user,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
):
    user_id = current_user["id"]
    metrics = await gen_repo.get_summary_metrics(user_id)

    total_gen = metrics["total_generations"]
    success_gen = metrics["successful_generations"]
    total_dur = metrics["total_duration"]
    total_chars = metrics["total_characters"]
    lang_count = metrics["languages_used_count"]
    success_rate = metrics["success_rate"]

    # Format human-readable strings
    dur_minutes = total_dur / 60.0
    dur_str = f"{total_dur:.1f}s" if total_dur < 60 else f"{dur_minutes:.1f}m"

    return DashboardSummaryResponse(
        total_generations=MetricCardData(
            value=float(total_gen),
            formatted=str(total_gen),
            subtext="All attempted speech generations",
        ),
        successful_generations=MetricCardData(
            value=float(success_gen),
            formatted=str(success_gen),
            subtext="Generations completed with valid audio",
        ),
        total_audio_duration_seconds=MetricCardData(
            value=round(total_dur, 1),
            formatted=dur_str,
            subtext="Total synthesized speech duration",
        ),
        characters_processed=MetricCardData(
            value=float(total_chars),
            formatted=f"{total_chars:,}",
            subtext="Characters processed in speech",
        ),
        languages_used=MetricCardData(
            value=float(lang_count),
            formatted=str(lang_count),
            subtext="Distinct target speech languages",
        ),
        success_rate_pct=MetricCardData(
            value=success_rate,
            formatted=f"{success_rate}%",
            subtext="Completed vs attempted requests",
        ),
    )

@router.get("/activity", response_model=List[ActivityDataPoint])
async def get_dashboard_activity(
    days: int = Query(default=30, ge=1, le=180),
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
):
    user_id = current_user["id"]
    daily_items = await gen_repo.get_daily_activity(user_id, days=days)
    return [
        ActivityDataPoint(
            date=item["date"],
            count=item["count"],
            success_count=item["success_count"],
            duration_seconds=round(item["duration_seconds"], 1),
        )
        for item in daily_items
    ]

@router.get("/language-distribution", response_model=List[LanguageDataPoint])
async def get_language_distribution(
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
):
    user_id = current_user["id"]
    items = await gen_repo.get_language_distribution(user_id)
    return [
        LanguageDataPoint(
            language=item["language"],
            name=item["name"],
            count=item["count"],
            percentage=item["percentage"],
        )
        for item in items
    ]

@router.get("/status-distribution", response_model=List[StatusDataPoint])
async def get_status_distribution(
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
):
    user_id = current_user["id"]
    metrics = await gen_repo.get_summary_metrics(user_id)
    # Strict 5-color palette:
    # Completed -> #3AAFA9 (Mana Teal)
    # Failed -> #17252A (Midnight Navy)
    # In-progress -> #2B7A78 (Deep Teal)
    return [
        StatusDataPoint(status="Completed", count=metrics["successful_generations"], color="#3AAFA9"),
        StatusDataPoint(status="Failed", count=metrics["failed_generations"], color="#17252A"),
    ]

@router.get("/recent-generations", response_model=List[GenerationResponse])
async def get_recent_generations(
    limit: int = Query(default=8, ge=1, le=20),
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
    saved_repo: SavedAudioRepository = Depends(get_saved_audio_repository),
):
    user_id = current_user["id"]
    docs = await gen_repo.get_recent_activity(user_id, limit=limit)
    items = []
    for doc in docs:
        is_saved = await saved_repo.is_saved(user_id, doc["id"])
        items.append(
            GenerationResponse(
                id=doc["id"],
                user_id=doc["user_id"],
                original_text=doc["original_text"],
                translated_text=doc.get("translated_text"),
                source_language=doc["source_language"],
                target_language=doc["target_language"],
                translation_provider=doc.get("translation_provider"),
                tts_provider=doc["tts_provider"],
                model_id=doc["model_id"],
                voice_id=doc.get("voice_id"),
                status=doc["status"],
                error_code=doc.get("error_code"),
                error_message_safe=doc.get("error_message_safe"),
                audio_url=f"/api/v1/speech/{doc['id']}/audio" if doc.get("audio_storage_key") else None,
                audio_format=doc.get("audio_format", "wav"),
                sample_rate=doc.get("sample_rate", 16000),
                duration_seconds=doc.get("duration_seconds", 0.0),
                file_size_bytes=doc.get("file_size_bytes", 0),
                character_count=doc.get("character_count", 0),
                created_at=doc["created_at"],
                completed_at=doc.get("completed_at"),
                is_saved=is_saved,
            )
        )
    return items

@router.get("/usage", response_model=DashboardUsageResponse)
async def get_monthly_usage_stats(
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
):
    user_id = current_user["id"]
    stats = await gen_repo.get_monthly_usage(user_id)
    return DashboardUsageResponse(
        generations_this_month=stats["count"],
        characters_this_month=stats["characters"],
        audio_seconds_this_month=stats["duration"],
    )
