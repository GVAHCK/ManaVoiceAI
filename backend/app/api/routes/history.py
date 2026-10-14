from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.schemas.history import HistoryListResponse
from app.schemas.speech import GenerationResponse
from app.repositories.generation_repository import GenerationRepository
from app.repositories.saved_audio_repository import SavedAudioRepository
from app.services.storage_service import storage_service
from app.api.deps import (
    get_generation_repository,
    get_saved_audio_repository,
    get_current_user,
)

router = APIRouter(prefix="/history", tags=["History"])

@router.get("", response_model=HistoryListResponse)
async def list_history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    target_language: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    sort_by: str = Query(default="newest", pattern="^(newest|oldest)$"),
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
    saved_repo: SavedAudioRepository = Depends(get_saved_audio_repository),
):
    user_id = current_user["id"]
    docs, total = await gen_repo.list_user_generations(
        user_id=user_id,
        page=page,
        page_size=page_size,
        search=search,
        target_language=target_language,
        status=status,
        sort_by=sort_by,
    )

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

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return HistoryListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )

@router.get("/{generation_id}", response_model=GenerationResponse)
async def get_history_item(
    generation_id: str,
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
    saved_repo: SavedAudioRepository = Depends(get_saved_audio_repository),
):
    doc = await gen_repo.get_by_id(generation_id, current_user["id"])
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generation record not found.")

    is_saved = await saved_repo.is_saved(current_user["id"], generation_id)
    return GenerationResponse(
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
        audio_url=f"/api/v1/speech/{generation_id}/audio" if doc.get("audio_storage_key") else None,
        audio_format=doc.get("audio_format", "wav"),
        sample_rate=doc.get("sample_rate", 16000),
        duration_seconds=doc.get("duration_seconds", 0.0),
        file_size_bytes=doc.get("file_size_bytes", 0),
        character_count=doc.get("character_count", 0),
        created_at=doc["created_at"],
        completed_at=doc.get("completed_at"),
        is_saved=is_saved,
    )

@router.delete("/{generation_id}")
async def delete_history_item(
    generation_id: str,
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
    saved_repo: SavedAudioRepository = Depends(get_saved_audio_repository),
):
    user_id = current_user["id"]
    storage_key = await gen_repo.delete(generation_id, user_id)
    if not storage_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generation record not found.")

    await saved_repo.unsave(user_id, generation_id)
    storage_service.delete_audio(storage_key)
    return {"message": "Generation deleted successfully."}
