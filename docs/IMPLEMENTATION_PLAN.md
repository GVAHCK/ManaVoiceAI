# ManaVoice AI — Implementation Execution Plan

## 1. Overview & Phased Roadmap

This plan details the sequential engineering execution to transform ManaVoice AI into an enterprise-grade multilingual video translation, voice synthesis, and lip-sync platform.

---

## 2. Execution Phases

### Phase 1: Repository Audit & Baseline Verification (Completed)
- [x] Inspect directory structure, dependencies, database models, and routes.
- [x] Verify hardware: Intel i5-13420H (12 threads), RTX 3050 (6GB VRAM), 16GB RAM, FFmpeg 9.0.1.
- [x] Identify storage constraints (Drive C: ~305 MB free; Drives D: and E: >120 GB free).
- [x] Run baseline tests: 13/13 backend pytest tests pass; frontend builds with 0 errors.
- [x] Create `docs/PROJECT_AUDIT.md`, `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION_PLAN.md`.

### Phase 2: Environment, Dependencies & Storage Safety
- [ ] Configure adaptive storage manager to prevent C: drive exhaustion (offload to D:/E: when configured).
- [ ] Install / verify required ML & media libraries (`kaggle`, `torchaudio`, `evaluate`, `jiwer`, `sacrebleu`).
- [ ] Update `.env.example` with Kaggle and storage configuration keys.

### Phase 3: Media Ingestion & Audio Extraction Pipeline
- [ ] Implement `MediaService` in `backend/app/services/media_service.py`.
- [ ] Add probe inspection (`ffprobe` wrapper for resolution, fps, duration, audio streams).
- [ ] Add 16 kHz mono PCM extraction for ASR and multi-track demuxing.
- [ ] Add MIME/format validator for MP4, MOV, MKV, WebM, AVI, WAV, MP3.

### Phase 4: Pretrained ASR & Transcript Segmentation
- [ ] Implement `ASRService` in `backend/app/services/asr_service.py` using Whisper architecture.
- [ ] Support language detection, timestamped segment generation, confidence scores.
- [ ] Support Indian languages (Hindi, Telugu, Tamil, etc.) and English.
- [ ] Implement transcript segment schema and persistence.

### Phase 5: Translation Engine & Language Capability Registry
- [ ] Implement `MultilingualTranslationService` supporting NLLB/Marian/LibreTranslate/offline glossary.
- [ ] Support sentence chunking, punctuation normalization, glossary overrides.
- [ ] Implement verified Language Capability Matrix (`configs/languages.yaml` or registry).

### Phase 6: Multi-Voice Neural TTS & Segment Synthesis
- [ ] Extend `TTSEngine` with multi-voice presets and speaking rate controls (0.75x - 1.5x).
- [ ] Add silence padding and loudness normalization (-16 LUFS).
- [ ] Implement segment-by-segment audio synthesis pipeline.

### Phase 7: Timing Alignment, Audio Mixing & Subtitle Generation
- [ ] Implement `AlignmentService` using FFmpeg `atempo` time-stretching within safe bounds (0.85x - 1.25x).
- [ ] Implement background audio mixing (combining translated speech with original background ambience).
- [ ] Implement `SubtitleService` generating SubRip (`.srt`) and WebVTT (`.vtt`) files.

### Phase 8: Lip-Sync Integration & Graceful Degradation
- [ ] Implement `LipSyncService` in `backend/app/services/lipsync_service.py`.
- [ ] Support face detection and audio-driven mouth region synchronization (Wav2Lip adapter).
- [ ] Implement graceful fallback and status reporting when face is off-screen or lip-sync is disabled.

### Phase 9: Full Video Reconstruction & Artifact Packaging
- [ ] Implement `VideoRenderingService` for final H.264/AAC MP4 multiplexing.
- [ ] Package output artifacts: Dubbed MP4, Dubbed WAV, Subtitles (.srt, .vtt), Transcript (.json, .txt).
- [ ] Secure artifact download endpoints with path traversal validation.

### Phase 10: Kaggle API Integration & Data Quality Pipeline
- [ ] Implement `KaggleService` (`backend/app/services/kaggle_service.py`).
- [ ] Implement dataset discovery, metadata inspection, file listing, authenticated download.
- [ ] Implement storage pre-checks before download.
- [ ] Create `configs/datasets.yaml` with verified dataset definitions.
- [ ] Build data quality pipeline (duration filtering, audio normalization, train/val/test splits).

### Phase 11: Real Model Training & Fine-Tuning Pipeline
- [ ] Implement `TrainingService` (`backend/app/services/training_service.py`).
- [ ] Implement training configurations, seeds, checkpoints, early stopping, and validation loss tracking.
- [ ] Provide smoke-test, dev-run, and full-run training profiles.

### Phase 12: Quantitative Model Evaluation Framework
- [ ] Create `docs/EVALUATION_PROTOCOL.md`.
- [ ] Implement `EvaluationService` calculating WER/CER (ASR), BLEU/chrF (Translation), RTF (TTS), and sync error.
- [ ] Provide automated evaluation runner generating verifiable evaluation reports.

### Phase 13: Full Frontend Experience & Visual Integration
- [ ] Add Video Studio mode to the dashboard adhering strictly to the 5-color palette.
- [ ] Video upload with drag-and-drop and media player preview.
- [ ] Interactive Transcript & Subtitle timeline editor with inline corrections and playback.
- [ ] Voice Studio with speaker-to-voice assignment.
- [ ] Real-time multi-stage processing dashboard.
- [ ] Export Center with downloads for all artifacts.
- [ ] Dataset & Model Management UI (Kaggle discovery & download).
- [ ] Model Evaluation Dashboard with actual metric charts.

### Phase 14: Security, Resource Limits & Reliability
- [ ] Subprocess sanitization, path traversal protection, MIME validation.
- [ ] User data isolation on all new video/job endpoints.
- [ ] Graceful cleanup of temporary render frames and intermediate files.

### Phase 15: Testing & Verification
- [ ] Unit & integration tests for media, ASR, translation, TTS, alignment, lip-sync, and export.
- [ ] End-to-end translation and video rendering test on a sample clip.
- [ ] Validate zero regressions on existing 13 tests.

### Phase 16: Local Demonstration & Final Report
- [ ] Execute complete end-to-end pipeline run on a valid test media clip.
- [ ] Generate comprehensive final engineering report.
