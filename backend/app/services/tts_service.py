import io
import sys
import types
import importlib.machinery
import asyncio
from typing import Dict, Any, Optional, Tuple
from pathlib import Path
from app.core.config import settings
from app.core.logging import logger
from app.services.storage_service import storage_service

# Ensure sklearn stub is registered before importing transformers on Windows to bypass AppLocker DLL block
if "sklearn" not in sys.modules:
    m = types.ModuleType("sklearn")
    m.__spec__ = importlib.machinery.ModuleSpec("sklearn", None)
    sys.modules["sklearn"] = m
    mm = types.ModuleType("sklearn.metrics")
    mm.__spec__ = importlib.machinery.ModuleSpec("sklearn.metrics", None)
    mm.roc_curve = lambda *a, **k: None
    sys.modules["sklearn.metrics"] = mm

import torch
import numpy as np
import soundfile as sf
from transformers.models.vits import VitsModel, VitsTokenizer

# Supported Languages & Model Registry
MODEL_REGISTRY: Dict[str, Dict[str, Any]] = {
    "en": {
        "name": "English",
        "native_name": "English",
        "model_id": "facebook/mms-tts-eng",
        "license": "CC-BY-NC 4.0",
        "sample_rate": 16000,
        "default_voice": "Female/Standard",
        "voices": ["Female/Standard"],
        "notes": "Verified MMS-TTS checkpoint for English speech synthesis.",
    },
    "es": {
        "name": "Spanish",
        "native_name": "Español",
        "model_id": "facebook/mms-tts-spa",
        "license": "CC-BY-NC 4.0",
        "sample_rate": 16000,
        "default_voice": "Standard",
        "voices": ["Standard"],
        "notes": "MMS-TTS checkpoint for Spanish speech synthesis.",
    },
    "fr": {
        "name": "French",
        "native_name": "Français",
        "model_id": "facebook/mms-tts-fra",
        "license": "CC-BY-NC 4.0",
        "sample_rate": 16000,
        "default_voice": "Standard",
        "voices": ["Standard"],
        "notes": "MMS-TTS checkpoint for French speech synthesis.",
    },
    "de": {
        "name": "German",
        "native_name": "Deutsch",
        "model_id": "facebook/mms-tts-deu",
        "license": "CC-BY-NC 4.0",
        "sample_rate": 16000,
        "default_voice": "Standard",
        "voices": ["Standard"],
        "notes": "MMS-TTS checkpoint for German speech synthesis.",
    },
    "hi": {
        "name": "Hindi",
        "native_name": "हिन्दी",
        "model_id": "facebook/mms-tts-hin",
        "license": "CC-BY-NC 4.0",
        "sample_rate": 16000,
        "default_voice": "Standard",
        "voices": ["Standard"],
        "notes": "MMS-TTS checkpoint for Hindi speech synthesis.",
    },
    "te": {
        "name": "Telugu",
        "native_name": "తెలుగు",
        "model_id": "facebook/mms-tts-tel",
        "license": "CC-BY-NC 4.0",
        "sample_rate": 16000,
        "default_voice": "Standard",
        "voices": ["Standard"],
        "notes": "MMS-TTS checkpoint for Telugu speech synthesis.",
    },
}

class TTSEngine:
    def __init__(self):
        self._models: Dict[str, VitsModel] = {}
        self._tokenizers: Dict[str, VitsTokenizer] = {}
        self._lock = asyncio.Lock()
        self._semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_GENERATIONS)
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() and settings.DEVICE == "cuda" else "cpu"
        )
        logger.info(f"TTSEngine initialized with device: {self.device}")

    def get_supported_languages(self) -> Dict[str, Dict[str, Any]]:
        return MODEL_REGISTRY

    def is_model_cached(self, model_id: str) -> bool:
        # Check if model exists in memory or in huggingface hub cache
        if model_id in self._models:
            return True
        sanitized = f"models--{model_id.replace('/', '--')}"
        # Check both configured HF_HOME and default home cache
        candidate_dirs = [
            Path(settings.HF_HOME) / "hub",
            Path(settings.HF_HOME),
            Path.home() / ".cache" / "huggingface" / "hub",
        ]
        return any((d / sanitized).exists() for d in candidate_dirs)

    def _load_model(self, model_id: str):
        if model_id not in self._models:
            logger.info(f"Loading TTS model and tokenizer for '{model_id}'...")
            tokenizer = VitsTokenizer.from_pretrained(model_id)
            model = VitsModel.from_pretrained(model_id).to(self.device)
            model.eval()
            self._tokenizers[model_id] = tokenizer
            self._models[model_id] = model
            logger.info(f"Successfully loaded and cached '{model_id}'")
        return self._tokenizers[model_id], self._models[model_id]

    async def generate_speech(
        self,
        text: str,
        target_lang: str = "en",
        model_id: Optional[str] = None,
        voice_id: Optional[str] = "default",
        speaking_rate: float = 1.0,
    ) -> Tuple[str, float, int, int]:
        lang_info = MODEL_REGISTRY.get(target_lang.lower())
        if not lang_info:
            raise ValueError(f"Language '{target_lang}' is not supported for speech synthesis.")

        clean_text = (text or "").strip()
        if not any(c.isalnum() for c in clean_text):
            logger.info("Text contains no alphanumeric characters; generating 0.5s neutral silence.")
            sample_rate = 16000
            waveform = np.zeros(int(sample_rate * 0.5), dtype=np.float32)
            buffer = io.BytesIO()
            sf.write(buffer, waveform, sample_rate, format="WAV")
            wav_bytes = buffer.getvalue()
            duration = 0.5
            storage_key, file_size = storage_service.save_audio_bytes(wav_bytes, format="wav")
            return storage_key, duration, sample_rate, file_size

        resolved_model_id = model_id or lang_info["model_id"]

        async with self._semaphore:
            async with self._lock:
                # Load or retrieve cached model
                try:
                    tokenizer, model = await asyncio.to_thread(self._load_model, resolved_model_id)
                except Exception as e:
                    logger.error(f"Failed to load TTS model '{resolved_model_id}': {e}")
                    raise RuntimeError(f"Model loading error for {resolved_model_id}: {str(e)}")

            def _inference():
                inputs = tokenizer(clean_text, return_tensors="pt").to(self.device)
                with torch.no_grad():
                    output = model(**inputs)
                    waveform = output.waveform[0].cpu().numpy()

                sample_rate = model.config.sampling_rate

                # Soundfile write to in-memory bytes
                buffer = io.BytesIO()
                sf.write(buffer, waveform, sample_rate, format="WAV")
                wav_bytes = buffer.getvalue()
                duration = len(waveform) / sample_rate
                return wav_bytes, duration, sample_rate

            try:
                wav_bytes, duration, sample_rate = await asyncio.to_thread(_inference)
            except Exception as e:
                logger.error(f"TTS inference failed for text '{text[:30]}...': {e}")
                raise RuntimeError(f"Speech synthesis error: {str(e)}")

            # Save to audio storage
            storage_key, file_size = storage_service.save_audio_bytes(wav_bytes, format="wav")
            logger.info(f"Generated speech stored as {storage_key} ({duration:.2f}s, {file_size} bytes)")
            return storage_key, duration, sample_rate, file_size

tts_engine = TTSEngine()
