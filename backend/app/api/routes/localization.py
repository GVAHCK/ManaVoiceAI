import os
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_current_user
from app.db.mongodb import get_db
from app.core.config import settings
from app.core.logging import logger
from app.models.localization_job import LocalizationJobModel, TimelineSegment
from app.repositories.localization_repository import LocalizationRepository
from app.services.storage_service import storage_service
from app.services.media_service import media_service
from app.services.translation_service import translation_service
from app.services.pipeline_orchestrator import pipeline_orchestrator

router = APIRouter(tags=["Localization & Video Translation"])

@router.post("/media/upload")
async def upload_media_file(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Upload audio or video file with MIME validation, size check, and ffprobe stream inspection."""
    content = await file.read()
    file_size = len(content)

    valid, err = media_service.validate_media_file(file.filename, file_size)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)

    storage_service.assert_disk_space(required_mb=int(file_size / (1024 * 1024)) + 50)

    # Save to media storage
    storage_key, _ = storage_service.save_media_bytes(content, file.filename)
    saved_path = storage_service.get_media_path(storage_key)

    try:
        probe = media_service.probe_media(saved_path)
    except Exception as e:
        storage_service.delete_file("media", storage_key)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Invalid media file: {str(e)}")

    return {
        "storage_key": storage_key,
        "filename": file.filename,
        "size_bytes": file_size,
        "probe": probe,
    }

@router.post("/localization/jobs", status_code=status.HTTP_201_CREATED)
async def create_localization_job(
    background_tasks: BackgroundTasks,
    source_media_storage_key: str = Form(...),
    source_filename: str = Form(...),
    source_language: str = Form("en"),
    target_language: str = Form("es"),
    job_type: str = Form("video_localization"),
    enable_lipsync: bool = Form(True),
    burn_subtitles: bool = Form(False),
    speech_volume: float = Form(1.0),
    background_volume: float = Form(0.25),
    speaking_rate: float = Form(1.0),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Create a new media localization job and start background worker execution."""
    media_path = storage_service.get_media_path(source_media_storage_key)
    if not media_path or not media_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Uploaded media file not found.")

    repo = LocalizationRepository(db)
    job = LocalizationJobModel(
        user_id=current_user["id"],
        job_type=job_type,
        status="pending",
        current_stage="queued",
        stage_progress_pct=0,
        source_language=source_language.lower(),
        target_language=target_language.lower(),
        source_media_storage_key=source_media_storage_key,
        source_filename=source_filename,
        enable_lipsync=enable_lipsync,
        burn_subtitles=burn_subtitles,
        speech_volume=speech_volume,
        background_volume=background_volume,
        speaking_rate=speaking_rate,
    )

    created = await repo.create(job)
    background_tasks.add_task(pipeline_orchestrator.process_localization_job, created["id"], repo)

    return created

@router.get("/localization/jobs")
async def list_localization_jobs(
    page: int = 1,
    page_size: int = 10,
    status_filter: Optional[str] = None,
    job_type: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    repo = LocalizationRepository(db)
    items, total = await repo.list_user_jobs(
        user_id=current_user["id"],
        page=page,
        page_size=page_size,
        status=status_filter,
        job_type=job_type,
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}

@router.get("/localization/jobs/{job_id}")
async def get_localization_job(
    job_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    repo = LocalizationRepository(db)
    job = await repo.get_by_id(job_id, current_user["id"])
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Localization job not found.")
    return job

@router.patch("/localization/jobs/{job_id}/segments/{segment_id}")
async def update_job_segment(
    job_id: str,
    segment_id: int,
    original_text: Optional[str] = None,
    translated_text: Optional[str] = None,
    speaker: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Allows user review and inline correction of transcripts and translations before or after rendering."""
    repo = LocalizationRepository(db)
    updated = await repo.update_segment(
        job_id=job_id,
        user_id=current_user["id"],
        segment_id=segment_id,
        original_text=original_text,
        translated_text=translated_text,
        speaker=speaker,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job or segment not found.")
    return updated

@router.delete("/localization/jobs/{job_id}")
async def delete_localization_job(
    job_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    repo = LocalizationRepository(db)
    deleted = await repo.delete(job_id, current_user["id"])
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    # Cleanup artifacts
    for key in [
        deleted.get("source_media_storage_key"),
        deleted.get("output_video_storage_key"),
        deleted.get("output_audio_storage_key"),
        deleted.get("output_srt_storage_key"),
        deleted.get("output_vtt_storage_key"),
    ]:
        if key:
            storage_service.delete_audio(key)
            storage_service.delete_file("media", key)
            storage_service.delete_file("video", key)
            storage_service.delete_file("subtitles", key)

    return {"message": "Localization job and associated artifacts successfully deleted."}

@router.get("/localization/jobs/{job_id}/artifacts/{artifact_type}")
async def download_job_artifact(
    job_id: str,
    artifact_type: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Secure access-controlled download for video (MP4), dubbed audio (WAV), SRT, or VTT subtitles."""
    repo = LocalizationRepository(db)
    job = await repo.get_by_id(job_id, current_user["id"])
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    if artifact_type == "video":
        key = job.get("output_video_storage_key")
        path = storage_service.get_video_path(key) if key else None
        media_type = "video/mp4"
        download_name = f"localized_{job.get('source_filename', 'video.mp4')}"
    elif artifact_type == "audio":
        key = job.get("output_audio_storage_key")
        path = storage_service.get_audio_path(key) if key else None
        media_type = "audio/wav"
        download_name = f"dubbed_{job.get('source_filename', 'audio')}.wav"
    elif artifact_type == "srt":
        key = job.get("output_srt_storage_key")
        path = storage_service.get_subtitle_path(key) if key else None
        media_type = "application/x-subrip"
        download_name = f"subtitles_{job.get('target_language', 'trans')}.srt"
    elif artifact_type == "vtt":
        key = job.get("output_vtt_storage_key")
        path = storage_service.get_subtitle_path(key) if key else None
        media_type = "text/vtt"
        download_name = f"subtitles_{job.get('target_language', 'trans')}.vtt"
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown artifact type: {artifact_type}")

    if not path or not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Artifact {artifact_type} not yet ready or generated.")

    return FileResponse(
        path=path,
        media_type=media_type,
        filename=download_name,
    )
