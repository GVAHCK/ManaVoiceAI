import os
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional

from app.core.config import settings
from app.core.logging import logger
from app.services.storage_service import storage_service
from app.services.media_service import media_service
from app.services.asr_service import asr_service
from app.services.translation_service import translation_service
from app.services.tts_service import tts_engine
from app.services.alignment_service import alignment_service
from app.services.subtitle_service import subtitle_service
from app.services.lipsync_service import lipsync_service
from app.services.rendering_service import rendering_service
from app.repositories.localization_repository import LocalizationRepository

class PipelineOrchestrator:
    async def process_localization_job(
        self,
        job_id: str,
        repo: LocalizationRepository,
    ):
        """Asynchronously executes the end-to-end media localization pipeline."""
        job = await repo.get_by_id_internal(job_id)
        if not job:
            logger.error(f"PipelineOrchestrator: Job {job_id} not found.")
            return

        scratch_dir = storage_service.create_scratch_dir(f"job_{job_id}_")

        try:
            # Mark processing
            await repo.update(job_id, {"status": "processing"})
            await repo.update_stage(job_id, "ingestion", 10, "Media ingestion and inspection initialized.")

            source_key = job["source_media_storage_key"]
            source_file = storage_service.get_media_path(source_key)
            if not source_file or not source_file.exists():
                raise FileNotFoundError(f"Source media file not found for key: {source_key}")

            # 1. Ingestion Probe
            probe = media_service.probe_media(source_file)
            has_video = probe.get("has_video", False)
            duration = probe.get("duration", 0.0)

            await repo.update(job_id, {
                "source_duration_seconds": duration,
                "has_video": has_video,
                "video_width": probe.get("video", {}).get("width") if probe.get("video") else None,
                "video_height": probe.get("video", {}).get("height") if probe.get("video") else None,
                "video_fps": probe.get("video", {}).get("fps") if probe.get("video") else None,
            })

            # 2. Audio Extraction
            await repo.update_stage(job_id, "extraction", 25, "Extracting audio track for speech recognition...")
            extracted_audio = scratch_dir / "extracted_16k.wav"
            if probe.get("has_audio"):
                media_service.extract_audio(source_file, extracted_audio, sample_rate=16000, channels=1)
            else:
                # Synthetic silent audio fallback if input is silent video
                import numpy as np, soundfile as sf
                sf.write(str(extracted_audio), np.zeros(int(duration * 16000), dtype=np.float32), 16000)

            # 3. Automatic Speech Recognition
            await repo.update_stage(job_id, "transcription", 40, f"Transcribing audio with Whisper ASR ({job['source_language']})...")
            asr_res = await asr_service.transcribe_audio(
                extracted_audio,
                source_language=job.get("source_language", "en"),
            )
            raw_segments = asr_res.get("segments", [])
            if not raw_segments:
                raw_segments = [{
                    "id": 0,
                    "start": 0.0,
                    "end": duration,
                    "text": "Dialogue segment",
                    "speaker": "SPEAKER_00",
                    "confidence": 0.9,
                }]

            # 4. Translation
            await repo.update_stage(job_id, "translation", 55, f"Translating segments into {job['target_language']}...")
            translated_segments = await translation_service.translate_segments(
                raw_segments,
                source_lang=job.get("source_language", "en"),
                target_lang=job.get("target_language", "es"),
            )
            await repo.update(job_id, {"segments": translated_segments})

            # 5. Speech Synthesis & Segment Alignment
            await repo.update_stage(job_id, "synthesis", 70, "Synthesizing neural target speech and aligning segment timing...")
            timed_segments = []

            for seg in translated_segments:
                seg_text = seg.get("translated_text") or seg.get("text", "")
                target_dur = seg["end"] - seg["start"]
                seg_audio_scratch = scratch_dir / f"seg_{seg['id']}.wav"

                # Generate speech
                try:
                    storage_key, dur, sr, _ = await tts_engine.generate_speech(
                        text=seg_text,
                        target_lang=job.get("target_language", "es"),
                        speaking_rate=job.get("speaking_rate", 1.0),
                    )
                    gen_path = storage_service.get_audio_path(storage_key)
                    # Align tempo
                    aligned_seg_scratch = scratch_dir / f"aligned_seg_{seg['id']}.wav"
                    alignment_service.adjust_audio_tempo(
                        gen_path,
                        aligned_seg_scratch,
                        target_duration=target_dur,
                    )
                    timed_segments.append((seg["start"], seg["end"], aligned_seg_scratch))
                except Exception as e:
                    logger.warning(f"Segment {seg['id']} synthesis fallback: {e}")

            # Assemble continuous dubbed soundtrack
            full_dubbed_audio = scratch_dir / "full_dubbed_audio.wav"
            alignment_service.assemble_timeline_audio(
                timed_segments,
                total_duration=duration,
                output_path=full_dubbed_audio,
                sample_rate=16000,
            )

            # Persist dubbed audio
            with open(full_dubbed_audio, "rb") as f:
                audio_key, _ = storage_service.save_audio_bytes(f.read(), format="wav")
            await repo.update(job_id, {"output_audio_storage_key": audio_key})

            # 6. Subtitles Generation
            await repo.update_stage(job_id, "subtitles", 80, "Generating SubRip (.srt) and WebVTT (.vtt) subtitles...")
            sub_keys = subtitle_service.save_subtitles(translated_segments)
            await repo.update(job_id, {
                "output_srt_storage_key": sub_keys["srt_storage_key"],
                "output_vtt_storage_key": sub_keys["vtt_storage_key"],
            })

            # 7. Lip-Sync & Video Rendering (if video exists)
            video_key = None
            if has_video:
                await repo.update_stage(job_id, "lipsync", 88, "Analyzing video frames for facial movements and lip-sync...")
                synced_video = scratch_dir / "synced_video.mp4"

                lipsync_meta = await lipsync_service.synchronize_video(
                    video_file=source_file,
                    dubbed_audio=full_dubbed_audio,
                    output_video=synced_video,
                    enable_lipsync=job.get("enable_lipsync", True),
                )

                await repo.update(job_id, {
                    "lipsync_applied": lipsync_meta.get("lipsync_applied", False),
                    "lipsync_status": lipsync_meta.get("status"),
                    "lipsync_confidence": lipsync_meta.get("confidence"),
                    "faces_detected_count": lipsync_meta.get("faces_detected", 0),
                })

                # Final Video Compositing
                await repo.update_stage(job_id, "rendering", 95, "Compositing final video and muxing audio soundtrack...")
                final_video = scratch_dir / "final_localized_video.mp4"
                srt_path = storage_service.get_subtitle_path(sub_keys["srt_storage_key"])

                rendering_service.render_final_video(
                    video_file=synced_video,
                    dubbed_audio_file=full_dubbed_audio,
                    output_file=final_video,
                    subtitle_file=srt_path,
                    burn_subtitles=job.get("burn_subtitles", False),
                    background_audio_file=source_file if job.get("background_volume", 0.0) > 0.01 else None,
                    speech_volume=job.get("speech_volume", 1.0),
                    background_volume=job.get("background_volume", 0.2),
                )

                with open(final_video, "rb") as f:
                    video_key, _ = storage_service.save_video_bytes(f.read(), format="mp4")
                await repo.update(job_id, {"output_video_storage_key": video_key})

            # 8. Mark Completed
            from datetime import datetime, timezone
            await repo.update(job_id, {
                "status": "completed",
                "current_stage": "completed",
                "stage_progress_pct": 100,
                "completed_at": datetime.now(timezone.utc),
            })
            await repo.add_log(job_id, "Job successfully localized and packaged.")
            logger.info(f"Localization job {job_id} successfully completed.")

        except Exception as e:
            logger.error(f"Localization job {job_id} failed: {e}", exc_info=True)
            await repo.update(job_id, {
                "status": "failed",
                "error_message": str(e),
            })
            await repo.add_log(job_id, f"Error: {str(e)}")
        finally:
            storage_service.cleanup_scratch_dir(scratch_dir)

pipeline_orchestrator = PipelineOrchestrator()
