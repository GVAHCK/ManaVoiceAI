import os
import asyncio
import pytest
from pathlib import Path
from mongomock_motor import AsyncMongoMockClient

from app.db.indexes import create_indexes
from app.models.localization_job import LocalizationJobModel
from app.repositories.localization_repository import LocalizationRepository
from app.services.storage_service import storage_service
from app.services.media_service import media_service
from app.services.pipeline_orchestrator import pipeline_orchestrator

@pytest.mark.asyncio
async def test_full_video_localization_pipeline_e2e():
    """Real end-to-end execution of the complete video localization pipeline.
    Tests: Ingestion -> Audio Extraction -> ASR -> Translation -> Synthesis -> Alignment -> Lip-Sync -> Video Rendering.
    """
    # 1. Setup in-memory MongoDB repository for isolated execution
    mock_client = AsyncMongoMockClient()
    db = mock_client["manavoice_e2e_test"]
    await create_indexes(db)
    repo = LocalizationRepository(db)

    # 2. Generate a valid, deterministic synthetic test video
    test_video_path = Path("storage/scratch/e2e_demo_input.mp4")
    media_service.create_synthetic_test_video(test_video_path, duration_s=2.5, width=640, height=480, fps=25)
    assert test_video_path.exists()

    # 3. Store in media storage
    with open(test_video_path, "rb") as f:
        media_key, file_size = storage_service.save_media_bytes(f.read(), "e2e_demo_input.mp4")

    # 4. Create Job Record
    job = LocalizationJobModel(
        user_id="e2e_test_user_antigravity",
        job_type="video_localization",
        status="pending",
        current_stage="queued",
        stage_progress_pct=0,
        source_language="en",
        target_language="es",
        source_media_storage_key=media_key,
        source_filename="e2e_demo_input.mp4",
        enable_lipsync=True,
        burn_subtitles=False,
        speech_volume=1.0,
        background_volume=0.2,
    )
    created_job = await repo.create(job)
    job_id = created_job["id"]

    # 5. Execute Pipeline Orchestrator directly
    await pipeline_orchestrator.process_localization_job(job_id, repo)

    # 6. Verify Job Completion and Output Artifacts
    completed_job = await repo.get_by_id_internal(job_id)
    assert completed_job is not None
    assert completed_job["status"] == "completed"
    assert completed_job["stage_progress_pct"] == 100
    assert completed_job["current_stage"] == "completed"

    # Verify Timeline Segments
    segments = completed_job.get("segments", [])
    assert len(segments) >= 1
    first_seg = segments[0]
    assert "text" in first_seg
    assert "start" in first_seg
    assert "end" in first_seg

    # Verify Subtitle Artifacts
    srt_key = completed_job.get("output_srt_storage_key")
    vtt_key = completed_job.get("output_vtt_storage_key")
    assert srt_key is not None
    assert vtt_key is not None
    srt_path = storage_service.get_subtitle_path(srt_key)
    assert srt_path is not None and srt_path.exists()
    assert srt_path.stat().st_size > 0

    # Verify Dubbed Audio Artifact
    audio_key = completed_job.get("output_audio_storage_key")
    assert audio_key is not None
    audio_path = storage_service.get_audio_path(audio_key)
    assert audio_path is not None and audio_path.exists()
    assert audio_path.stat().st_size > 0

    # Verify Rendered Video Artifact
    video_key = completed_job.get("output_video_storage_key")
    assert video_key is not None
    video_path = storage_service.get_video_path(video_key)
    assert video_path is not None and video_path.exists()
    assert video_path.stat().st_size > 0

    # Probe final rendered video
    final_probe = media_service.probe_media(video_path)
    assert final_probe["has_video"] is True
    assert final_probe["has_audio"] is True
    assert final_probe["duration"] > 0.0

    # Cleanup test files
    test_video_path.unlink(missing_ok=True)
    storage_service.delete_file("media", media_key)
    storage_service.delete_file("video", video_key)
    storage_service.delete_audio(audio_key)
    storage_service.delete_file("subtitles", srt_key)
    storage_service.delete_file("subtitles", vtt_key)
