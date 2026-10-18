import io
import pytest
from pathlib import Path
from unittest.mock import patch

from app.services.media_service import media_service
from app.services.asr_service import asr_service
from app.services.translation_service import translation_service
from app.services.subtitle_service import subtitle_service
from app.services.storage_service import storage_service

@pytest.mark.asyncio
async def test_media_upload_and_probe(client, auth_headers):
    # Create small synthetic test video
    scratch_video = Path("storage/scratch/unit_test_video.mp4")
    media_service.create_synthetic_test_video(scratch_video, duration_s=1.5)

    with open(scratch_video, "rb") as f:
        video_bytes = f.read()

    files = {"file": ("test_video.mp4", io.BytesIO(video_bytes), "video/mp4")}
    res = await client.post("/api/v1/media/upload", files=files, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "storage_key" in data
    assert data["probe"]["has_video"] is True
    assert data["probe"]["duration"] > 0.5

    # Cleanup local scratch
    scratch_video.unlink(missing_ok=True)
    storage_service.delete_file("media", data["storage_key"])

@pytest.mark.asyncio
async def test_invalid_file_upload_rejected(client, auth_headers):
    files = {"file": ("malicious.exe", io.BytesIO(b"dummy binary content"), "application/octet-stream")}
    res = await client.post("/api/v1/media/upload", files=files, headers=auth_headers)
    assert res.status_code == 400
    assert "Unsupported media extension" in res.json()["detail"]

@pytest.mark.asyncio
async def test_localization_job_lifecycle(client, auth_headers):
    # 1. Create test audio file in media storage
    scratch_audio = Path("storage/scratch/test_lifecycle_audio.wav")
    media_service.create_synthetic_test_video(scratch_audio.with_suffix(".mp4"), duration_s=1.0)
    media_service.extract_audio(scratch_audio.with_suffix(".mp4"), scratch_audio)

    with open(scratch_audio, "rb") as f:
        media_key, _ = storage_service.save_media_bytes(f.read(), "test_lifecycle_audio.wav")

    # 2. Create Job
    job_payload = {
        "source_media_storage_key": media_key,
        "source_filename": "test_lifecycle_audio.wav",
        "source_language": "en",
        "target_language": "es",
        "job_type": "audio_translation",
        "enable_lipsync": False,
    }
    with patch("app.services.pipeline_orchestrator.pipeline_orchestrator.process_localization_job"):
        create_res = await client.post("/api/v1/localization/jobs", data=job_payload, headers=auth_headers)
        assert create_res.status_code == 201
        job_data = create_res.json()
        job_id = job_data["id"]
        assert job_data["status"] == "pending"


    # 3. Retrieve Job Details
    get_res = await client.get(f"/api/v1/localization/jobs/{job_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == job_id

    # 4. List User Jobs
    list_res = await client.get("/api/v1/localization/jobs", headers=auth_headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # Cleanup
    await client.delete(f"/api/v1/localization/jobs/{job_id}", headers=auth_headers)
    scratch_audio.unlink(missing_ok=True)
    scratch_audio.with_suffix(".mp4").unlink(missing_ok=True)

@pytest.mark.asyncio
async def test_subtitle_generation_service():
    test_segments = [
        {
            "id": 1,
            "start": 0.0,
            "end": 2.5,
            "text": "Hello world",
            "translated_text": "Hola mundo",
            "speaker": "SPEAKER_00",
        },
        {
            "id": 2,
            "start": 3.0,
            "end": 5.25,
            "text": "Welcome to ManaVoice AI",
            "translated_text": "Bienvenido a ManaVoice AI",
            "speaker": "SPEAKER_01",
        },
    ]
    srt = subtitle_service.generate_srt(test_segments)
    vtt = subtitle_service.generate_vtt(test_segments)

    assert "00:00:00,000 --> 00:00:02,500" in srt
    assert "Hola mundo" in srt
    assert "WEBVTT" in vtt
    assert "00:00:03.000 --> 00:00:05.250" in vtt

@pytest.mark.asyncio
async def test_dataset_routes(client, auth_headers):
    # List datasets
    res = await client.get("/api/v1/datasets", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "datasets" in data
    assert len(data["datasets"]) >= 3

    # Search datasets
    s_res = await client.get("/api/v1/datasets/search?q=speech", headers=auth_headers)
    assert s_res.status_code == 200
    assert len(s_res.json()["datasets"]) >= 1

@pytest.mark.asyncio
async def test_training_smoke_test_endpoint(client, auth_headers):
    payload = {
        "task_type": "translation",
        "dataset_id": "multilingual-parallel-translation-corpus",
        "profile": "smoke_test",
        "learning_rate": 0.001,
        "batch_size": 4,
    }
    res = await client.post("/api/v1/training/jobs", json=payload, headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "completed"
    assert "best_val_loss" in data
    assert data["epochs"] == 2

@pytest.mark.asyncio
async def test_evaluation_endpoints(client, auth_headers):
    # Run evaluations
    run_res = await client.post("/api/v1/evaluations/run", headers=auth_headers)
    assert run_res.status_code == 200
    data = run_res.json()
    assert "asr" in data
    assert "translation" in data
    assert "tts" in data
    assert "lipsync" in data

    # Get latest
    get_res = await client.get("/api/v1/evaluations/latest", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["asr"]["metrics"]["wer_pct"] >= 0.0
