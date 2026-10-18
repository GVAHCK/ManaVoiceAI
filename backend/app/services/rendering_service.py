import os
import shutil
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional

from app.core.config import settings
from app.core.logging import logger
from app.services.media_service import media_service
from app.services.storage_service import storage_service

class RenderingService:
    def __init__(self):
        self.ffmpeg_path = media_service.ffmpeg_path

    def render_final_video(
        self,
        video_file: Path,
        dubbed_audio_file: Path,
        output_file: Path,
        subtitle_file: Optional[Path] = None,
        burn_subtitles: bool = False,
        background_audio_file: Optional[Path] = None,
        speech_volume: float = 1.0,
        background_volume: float = 0.2,
    ) -> Dict[str, Any]:
        """Composites video frames, dubbed audio, background ambience, and subtitles into a broadcast-ready MP4."""
        output_file.parent.mkdir(parents=True, exist_ok=True)
        scratch_dir = storage_service.create_scratch_dir("render_")

        try:
            # Step 1: Mix dubbed dialogue with background music if requested
            active_audio = dubbed_audio_file
            if background_audio_file and background_audio_file.exists() and background_volume > 0.01:
                mixed_audio = scratch_dir / "mixed_soundtrack.wav"
                active_audio = media_service.mix_audio_tracks(
                    dubbed_audio=dubbed_audio_file,
                    original_audio=background_audio_file,
                    output_file=mixed_audio,
                    dubbed_volume=speech_volume,
                    background_volume=background_volume,
                )

            # Step 2: Assemble FFmpeg command
            cmd = [
                self.ffmpeg_path,
                "-y",
                "-i", str(video_file),
                "-i", str(active_audio),
            ]

            filter_complex = []
            # Subtitle burn-in if requested
            if burn_subtitles and subtitle_file and subtitle_file.exists():
                # Escape path for FFmpeg filter on Windows
                escaped_sub_path = str(subtitle_file).replace("\\", "/").replace(":", "\\:")
                filter_complex.append(f"[0:v]subtitles='{escaped_sub_path}':force_style='FontSize=16,PrimaryColour=&H00FFFFFF,OutlineColour=&H0017252A'[vout]")
                cmd.extend(["-filter_complex", ";".join(filter_complex), "-map", "[vout]"])
            else:
                cmd.extend(["-map", "0:v:0"])

            cmd.extend([
                "-map", "1:a:0",
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-b:a", "192k",
                "-shortest",
                str(output_file),
            ])

            logger.info(f"Rendering final video to {output_file.name}...")
            subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=300)

            # Step 3: Validate rendered media
            probe = media_service.probe_media(output_file)
            logger.info(f"Final video rendered successfully: {probe.get('duration')}s, {probe.get('size_bytes')}B")

            return {
                "output_path": str(output_file),
                "duration": probe.get("duration", 0.0),
                "size_bytes": probe.get("size_bytes", 0),
                "has_video": probe.get("has_video", True),
                "has_audio": probe.get("has_audio", True),
                "video_codec": probe.get("video", {}).get("codec") if probe.get("video") else "h264",
                "audio_codec": probe.get("audio", {}).get("codec") if probe.get("audio") else "aac",
            }
        finally:
            storage_service.cleanup_scratch_dir(scratch_dir)

rendering_service = RenderingService()
