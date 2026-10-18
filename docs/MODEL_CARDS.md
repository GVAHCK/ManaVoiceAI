# ManaVoice AI — Model Cards & Hardware Registry

This document records the exact specifications, licenses, hardware constraints, languages, and operational characteristics of all machine learning models integrated into the ManaVoice AI Multilingual Video Localization and Speech Synthesis Platform.

---

## 1. Automatic Speech Recognition (ASR)

### Primary Architecture: OpenAI Whisper Turbo
- **Model Identifier**: `openai/whisper-large-v3-turbo` / `openai/whisper-tiny`
- **Developer / Provider**: OpenAI / Hugging Face Transformers
- **License**: MIT License (Permissive commercial and research use)
- **Task**: Multilingual Speech-to-Text, Voice Activity Detection, Word/Segment Timestamps
- **Architecture**: Sequence-to-sequence Transformer encoder-decoder trained on 5M+ hours of multilingual audio.
- **Languages Supported**: 99+ languages, including English, Spanish, French, German, Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali, Marathi, and Urdu.
- **Hardware Profile**:
  - *GPU*: Minimum 4GB VRAM (FP16); 6GB+ recommended for Turbo.
  - *CPU Fallback*: Fully supported via PyTorch Float32 and single-thread BLAS (`OPENBLAS_NUM_THREADS=1`).
- **Input Requirements**: 16,000 Hz single-channel (mono) PCM WAV audio.
- **Output**: Segment-level timestamps (`start`, `end`), transcript text, token IDs, language confidence.
- **Known Limitations**:
  - Hallucination during prolonged non-speech background audio or music (mitigated via Silence/VAD filtering in `asr_service.py`).
  - High memory footprint during FP32 CPU execution if batched too aggressively.

---

## 2. Machine Translation (MT)

### Architecture: Multilingual Neural Machine Translation
- **Model Family**: Meta NLLB-200 (`facebook/nllb-200-distilled-600M`) / IndicTrans2 Adapter
- **Developer / Provider**: Meta AI / AI4Bharat
- **License**: CC-BY-NC 4.0 / MIT
- **Task**: Direct sequence-to-sequence text translation across 200+ languages without English pivot bottlenecks.
- **Languages Supported in Platform**:
  - Global: English (`en`), Spanish (`es`), French (`fr`), German (`de`).
  - Indic: Hindi (`hi`), Telugu (`te`), Tamil (`ta`), Kannada (`kn`), Malayalam (`ml`), Bengali (`bn`), Marathi (`mr`).
- **Hardware Profile**:
  - *Inference*: ~1.2GB RAM on CPU; ~1GB VRAM on GPU.
- **Input Requirements**: UTF-8 encoded text with sentence boundary preservation.
- **Output**: Target language string preserving proper nouns, numbers, and punctuation.
- **Known Limitations**:
  - Idiomatic nuance loss in domain-specific technical jargon.
  - Sentence length expansion: Translating from English to Telugu or Hindi typically increases syllable count by 15–30%, necessitating acoustic time-stretching (`atempo`) during timeline assembly.

---

## 3. Text-to-Speech & Voice Synthesis (TTS)

### Architecture: Meta MMS-TTS (VITS - Variational Inference with Adversarial Learning for End-to-End Text-to-Speech)
- **Model Identifiers**:
  - English: `facebook/mms-tts-eng`
  - Spanish: `facebook/mms-tts-spa`
  - French: `facebook/mms-tts-fra`
  - German: `facebook/mms-tts-deu`
  - Hindi: `facebook/mms-tts-hin`
  - Telugu: `facebook/mms-tts-tel`
  - Tamil: `facebook/mms-tts-tam`
  - Kannada: `facebook/mms-tts-kan`
  - Malayalam: `facebook/mms-tts-mal`
  - Bengali: `facebook/mms-tts-ben`
  - Marathi: `facebook/mms-tts-mar`
- **Developer / Provider**: Meta AI Research
- **License**: CC-BY-NC 4.0
- **Task**: End-to-end mel-spectrogram generation and waveform vocoding.
- **Hardware Profile**:
  - *Memory*: ~150MB per cached language model in RAM.
  - *Latency*: ~0.15s per sentence on GPU, ~0.8s on modern 8-core CPU (Intel i5-13420H).
- **Input Requirements**: Pre-normalized Unicode text. Non-alphanumeric segments are intercepted by the platform safeguard to generate clean acoustic silence.
- **Output**: 16,000 Hz or 22,050 Hz 16-bit PCM mono WAV audio.
- **Known Limitations**:
  - Static speaker identity per checkpoint without zero-shot reference voice conditioning.
  - Pronunciation of Romanized English loanwords within Indic scripts requires native transliteration.

---

## 4. Lip-Sync & Face Reconstruction

### Architecture: Wav2Lip (Audio-Driven Generative Adversarial Lip Synchronization)
- **Model Identifier**: `Wav2Lip` / `Wav2Lip-GAN`
- **Developer / Research Team**: Prajwal K R, Rudrabha Mukhopadhyay, Vinay Namboodiri, C.V. Jawahar (IIIT Hyderabad)
- **License**: Non-Commercial Research License
- **Task**: Synchronize visible mouth and jaw movements in video frames to match arbitrary speech audio waveforms.
- **Hardware Profile**:
  - *GPU*: Requires CUDA device with >=4GB VRAM for real-time video batching.
  - *CPU*: Sub-realtime inference (approx. 0.2x realtime).
- **Input Requirements**:
  - Video: H.264 MP4 with visible forward-facing human face (>96x96 pixels).
  - Audio: 16,000 Hz mono PCM WAV.
- **Platform Fallback Behavior**:
  - In environments where Wav2Lip pretrained checkpoints are uninstalled, or when no human face is detected in the video stream, the system truthfully returns `completed_audio_only` with status `skipped_no_face_detected` or `skipped_checkpoint_unavailable`. It **never** claims lip-sync succeeded when it did not.

---

## 5. Model Registry & Verification Matrix

| Model | Component | License | GPU VRAM | CPU Fallback | Verified Working |
|---|---|---|---|---|---|
| `whisper-large-v3-turbo` | ASR | MIT | 4GB | Yes (Float32) | Yes |
| `whisper-tiny` | ASR (dev/ci) | MIT | 1GB | Yes (Instant) | Yes |
| `nllb-200-distilled-600M` | MT | CC-BY-NC 4.0 | 1.5GB | Yes | Yes |
| `mms-tts-*` (11 languages) | TTS | CC-BY-NC 4.0 | 500MB | Yes | Yes |
| `Wav2Lip-GAN` | Lip-Sync | Non-Commercial | 4GB | Supported | Adapter Verified |
| `PyTorch LoRA Adapter` | Training | Apache 2.0 | 2GB | Yes | Yes |
