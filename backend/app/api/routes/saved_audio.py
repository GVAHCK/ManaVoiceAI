from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.speech import GenerationResponse
from app.repositories.saved_audio_repository import SavedAudioRepository
from app.api.deps import get_saved_audio_repository, get_current_user

router = APIRouter(prefix="/saved-audio", tags=["Saved Audio"])

@router.get("", response_model=List[GenerationResponse])
async def list_saved_audio(
    current_user: dict = Depends(get_current_user),
    saved_repo: SavedAudioRepository = Depends(get_saved_audio_repository),
):
    user_id = current_user["id"]
    docs = await saved_repo.list_saved_for_user(user_id)
    return [
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
            is_saved=True,
        )
        for doc in docs
    ]

@router.post("/{generation_id}", status_code=status.HTTP_201_CREATED)
async def bookmark_audio(
    generation_id: str,
    current_user: dict = Depends(get_current_user),
    saved_repo: SavedAudioRepository = Depends(get_saved_audio_repository),
):
    user_id = current_user["id"]
    success = await saved_repo.save(user_id, generation_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generation not found or unauthorized.")
    return {"message": "Audio saved to library", "is_saved": True}

@router.delete("/{generation_id}")
async def unbookmark_audio(
    generation_id: str,
    current_user: dict = Depends(get_current_user),
    saved_repo: SavedAudioRepository = Depends(get_saved_audio_repository),
):
    user_id = current_user["id"]
    await saved_repo.unsave(user_id, generation_id)
    return {"message": "Audio removed from library", "is_saved": False}
