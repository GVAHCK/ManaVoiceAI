import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from app.schemas.speech import (
    TranslateRequest,
    TranslateResponse,
    GenerateSpeechRequest,
    GenerationResponse,
)
from app.models.generation import GenerationModel
from app.services.translation_service import translation_service
from app.services.tts_service import tts_engine, MODEL_REGISTRY
from app.services.storage_service import storage_service
from app.repositories.generation_repository import GenerationRepository
from app.repositories.saved_audio_repository import SavedAudioRepository
from app.api.deps import (
    get_generation_repository,
    get_saved_audio_repository,
    get_current_user,
)
from app.core.logging import logger

router = APIRouter(prefix="/speech", tags=["Speech"])

@router.post("/translate", response_model=TranslateResponse)
async def translate_text(
    req: TranslateRequest,
    current_user: dict = Depends(get_current_user),
):
    translated_text, provider = await translation_service.translate(
        req.text, req.source_language, req.target_language
    )
    return TranslateResponse(
        original_text=req.text,
        translated_text=translated_text,
        source_language=req.source_language,
        target_language=req.target_language,
        provider=provider,
    )

@router.post("/generate", response_model=GenerationResponse, status_code=status.HTTP_201_CREATED)
async def generate_speech(
    req: GenerateSpeechRequest,
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
):
    user_id = current_user["id"]
    target_lang = req.target_language.lower()

    if target_lang not in MODEL_REGISTRY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target language '{target_lang}' is not supported for speech synthesis.",
        )

    # Determine speech text (translated_text if present, else original_text)
    text_to_speak = (req.translated_text or req.original_text).strip()
    if not text_to_speak:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Speech text cannot be empty.",
        )

    model_info = MODEL_REGISTRY[target_lang]
    model_id = req.model_id or model_info["model_id"]
    request_id = str(uuid.uuid4())

    # Create initial pending record in MongoDB
    gen_model = GenerationModel(
        user_id=user_id,
        original_text=req.original_text,
        translated_text=req.translated_text,
        source_language=req.source_language,
        target_language=target_lang,
        translation_provider="libretranslate" if req.translated_text and req.source_language != target_lang else None,
        tts_provider="transformers",
        model_id=model_id,
        voice_id=req.voice_id or "default",
        status="pending",
        character_count=len(text_to_speak),
        request_id=request_id,
    )
    record = await gen_repo.create(gen_model)
    gen_id = record["id"]

    try:
        storage_key, duration, sample_rate, file_size = await tts_engine.generate_speech(
            text=text_to_speak,
            target_lang=target_lang,
            model_id=model_id,
            voice_id=req.voice_id or "default",
            speaking_rate=req.speaking_rate or 1.0,
        )

        completed_at = datetime.now(timezone.utc)
        updates = {
            "status": "completed",
            "audio_storage_key": storage_key,
            "duration_seconds": round(duration, 2),
            "sample_rate": sample_rate,
            "file_size_bytes": file_size,
            "completed_at": completed_at,
        }
        updated_doc = await gen_repo.update(gen_id, user_id, updates)
        return GenerationResponse(
            id=gen_id,
            user_id=user_id,
            original_text=updated_doc["original_text"],
            translated_text=updated_doc.get("translated_text"),
            source_language=updated_doc["source_language"],
            target_language=updated_doc["target_language"],
            translation_provider=updated_doc.get("translation_provider"),
            tts_provider=updated_doc["tts_provider"],
            model_id=updated_doc["model_id"],
            voice_id=updated_doc.get("voice_id"),
            status="completed",
            audio_url=f"/api/v1/speech/{gen_id}/audio",
            audio_format="wav",
            sample_rate=sample_rate,
            duration_seconds=round(duration, 2),
            file_size_bytes=file_size,
            character_count=updated_doc["character_count"],
            created_at=updated_doc["created_at"],
            completed_at=completed_at,
            is_saved=False,
        )
    except Exception as exc:
        logger.error(f"Generation {gen_id} failed: {exc}")
        await gen_repo.update(gen_id, user_id, {
            "status": "failed",
            "error_code": "TTS_INFERENCE_ERROR",
            "error_message_safe": str(exc),
        })
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech generation failed: {str(exc)}",
        )

@router.get("/{generation_id}", response_model=GenerationResponse)
async def get_generation_details(
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

@router.get("/{generation_id}/audio")
async def get_generation_audio(
    generation_id: str,
    token: str = None,
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
):
    # Enforce user ownership
    doc = await gen_repo.get_by_id(generation_id, current_user["id"])
    if not doc or not doc.get("audio_storage_key"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio file not found or not ready.")

    audio_path = storage_service.get_audio_path(doc["audio_storage_key"])
    if not audio_path or not audio_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio file missing from storage.")

    return FileResponse(
        path=str(audio_path),
        media_type="audio/wav",
        filename=f"manavoice_{generation_id}.wav",
    )

@router.post("/{generation_id}/retry", response_model=GenerationResponse)
async def retry_generation(
    generation_id: str,
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
):
    user_id = current_user["id"]
    doc = await gen_repo.get_by_id(generation_id, user_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generation record not found.")

    text_to_speak = (doc.get("translated_text") or doc["original_text"]).strip()
    target_lang = doc["target_language"].lower()

    try:
        storage_key, duration, sample_rate, file_size = await tts_engine.generate_speech(
            text=text_to_speak,
            target_lang=target_lang,
            model_id=doc.get("model_id"),
        )
        completed_at = datetime.now(timezone.utc)
        updates = {
            "status": "completed",
            "audio_storage_key": storage_key,
            "duration_seconds": round(duration, 2),
            "sample_rate": sample_rate,
            "file_size_bytes": file_size,
            "error_code": None,
            "error_message_safe": None,
            "completed_at": completed_at,
        }
        updated_doc = await gen_repo.update(generation_id, user_id, updates)
        return GenerationResponse(
            id=generation_id,
            user_id=user_id,
            original_text=updated_doc["original_text"],
            translated_text=updated_doc.get("translated_text"),
            source_language=updated_doc["source_language"],
            target_language=updated_doc["target_language"],
            translation_provider=updated_doc.get("translation_provider"),
            tts_provider=updated_doc["tts_provider"],
            model_id=updated_doc["model_id"],
            voice_id=updated_doc.get("voice_id"),
            status="completed",
            audio_url=f"/api/v1/speech/{generation_id}/audio",
            audio_format="wav",
            sample_rate=sample_rate,
            duration_seconds=round(duration, 2),
            file_size_bytes=file_size,
            character_count=updated_doc["character_count"],
            created_at=updated_doc["created_at"],
            completed_at=completed_at,
            is_saved=False,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Retry failed: {str(exc)}")

@router.delete("/{generation_id}", status_code=status.HTTP_200_OK)
async def delete_generation(
    generation_id: str,
    current_user: dict = Depends(get_current_user),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
    saved_repo: SavedAudioRepository = Depends(get_saved_audio_repository),
):
    user_id = current_user["id"]
    storage_key = await gen_repo.delete(generation_id, user_id)
    if not storage_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generation not found or unauthorized.")

    # Remove bookmark if saved
    await saved_repo.unsave(user_id, generation_id)
    # Remove audio file from disk
    storage_service.delete_audio(storage_key)
    return {"message": "Generation and audio permanently deleted."}
