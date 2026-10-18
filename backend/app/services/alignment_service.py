import os
import shutil
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Tuple
import numpy as np
import soundfile as sf

from app.core.config import settings
from app.core.logging import logger
from app.services.media_service import media_service

class AlignmentService:
    def __init__(self):
        self.ffmpeg_path = media_service.ffmpeg_path

    def adjust_audio_tempo(
        self,
        input_audio: Path,
        output_audio: Path,
        target_duration: float,
        min_tempo: float = 0.85,
        max_tempo: float = 1.25,
    ) -> Path:
        """Adjust tempo of audio segment to match target interval within natural bounds without pitch distortion."""
        output_audio.parent.mkdir(parents=True, exist_ok=True)
        try:
            waveform, sr = sf.read(str(input_audio))
            actual_duration = len(waveform) / sr
        except Exception as e:
            logger.warning(f"Failed to read audio for tempo adjustment: {e}")
            shutil.copyfile(input_audio, output_audio)
            return output_audio

        if actual_duration <= 0.05 or target_duration <= 0.05:
            shutil.copyfile(input_audio, output_audio)
            return output_audio

        ratio = actual_duration / target_duration
        if 0.95 <= ratio <= 1.05:
            # Virtually identical duration, skip resampling
            shutil.copyfile(input_audio, output_audio)
            return output_audio

        # Clamp tempo to preserve voice naturalness and avoid chipmunk or sluggish artifacts
        clamped_tempo = max(min_tempo, min(max_tempo, ratio))

        cmd = [
            self.ffmpeg_path,
            "-y",
            "-i", str(input_audio),
            "-filter:a", f"atempo={clamped_tempo:.3f}",
            "-vn",
            "-acodec", "pcm_s16le",
            str(output_audio),
        ]

        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=60)
            return output_audio
        except subprocess.CalledProcessError as e:
            logger.warning(f"FFmpeg atempo adjustment failed ({e.stderr}), using original audio")
            shutil.copyfile(input_audio, output_audio)
            return output_audio

    def assemble_timeline_audio(
        self,
        timed_audio_segments: List[Tuple[float, float, Path]],
        total_duration: float,
        output_path: Path,
        sample_rate: int = 16000,
    ) -> Path:
        """Assembles discrete dubbed audio segments onto a continuous timeline matching original video duration."""
        output_path.parent.mkdir(parents=True, exist_ok=True)
        total_samples = int(total_duration * sample_rate)
        timeline = np.zeros(total_samples, dtype=np.float32)

        for start_s, end_s, audio_file in timed_audio_segments:
            if not audio_file.exists():
                continue
            try:
                data, sr = sf.read(str(audio_file))
                if data.ndim > 1:
                    data = np.mean(data, axis=1)
                if sr != sample_rate:
                    import scipy.signal
                    target_len = int(len(data) * sample_rate / sr)
                    data = scipy.signal.resample(data, target_len)

                start_idx = max(0, int(start_s * sample_rate))
                end_idx = min(total_samples, start_idx + len(data))
                insert_len = end_idx - start_idx

                if insert_len > 0:
                    timeline[start_idx:end_idx] += data[:insert_len]
            except Exception as e:
                logger.warning(f"Error placing segment {audio_file.name} at {start_s}s: {e}")

        # Peak normalization to prevent clipping
        max_val = np.max(np.abs(timeline))
        if max_val > 0.99:
            timeline = timeline / (max_val + 1e-4) * 0.95

        sf.write(str(output_path), timeline, sample_rate, format="WAV")
        logger.info(f"Assembled timeline audio track: {output_path.name} ({total_duration:.2f}s, {sample_rate}Hz)")
        return output_path

alignment_service = AlignmentService()
