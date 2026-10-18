import os
import json
import shutil
import asyncio
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from app.core.config import settings
from app.core.logging import logger

ALLOWED_MEDIA_EXTENSIONS = {
    "mp4", "mov", "mkv", "webm", "avi", "flv", "wmv", "m4v",
    "wav", "mp3", "m4a", "flac", "ogg", "aac", "wma"
}

ALLOWED_VIDEO_EXTENSIONS = {"mp4", "mov", "mkv", "webm", "avi", "flv", "wmv", "m4v"}
ALLOWED_AUDIO_EXTENSIONS = {"wav", "mp3", "m4a", "flac", "ogg", "aac", "wma"}

class MediaService:
    def __init__(self):
        self.ffmpeg_path = self._find_binary("ffmpeg")
        self.ffprobe_path = self._find_binary("ffprobe")
        logger.info(f"MediaService initialized with ffmpeg={self.ffmpeg_path}, ffprobe={self.ffprobe_path}")

    def _find_binary(self, binary_name: str) -> str:
        # Check standard PATH
        found = shutil.which(binary_name)
        if found:
            return found
        # Common Windows fallback
        for candidate in [
            Path(f"C:/Program Files/ffmpeg/bin/{binary_name}.exe"),
            Path(f"C:/ffmpeg/bin/{binary_name}.exe"),
        ]:
            if candidate.exists():
                return str(candidate)
        return binary_name

    def validate_media_file(self, filename: str, file_size: int) -> Tuple[bool, Optional[str]]:
        ext = os.path.splitext(filename)[1].lstrip(".").lower()
        if ext not in ALLOWED_MEDIA_EXTENSIONS:
            return False, f"Unsupported media extension '.{ext}'. Supported formats: {', '.join(sorted(ALLOWED_MEDIA_EXTENSIONS))}."
        max_bytes = settings.MAX_MEDIA_FILE_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            return False, f"File size ({file_size / (1024*1024):.1f}MB) exceeds maximum allowed {settings.MAX_MEDIA_FILE_SIZE_MB}MB."
        return True, None

    def probe_media(self, file_path: Path) -> Dict[str, Any]:
        """Inspect media file streams, duration, resolution, and codecs via ffprobe."""
        if not file_path.exists():
            raise FileNotFoundError(f"Media file not found at {file_path}")

        cmd = [
            self.ffprobe_path,
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            str(file_path),
        ]

        try:
            res = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=30)
            data = json.loads(res.stdout)
        except subprocess.TimeoutExpired:
            raise TimeoutError(f"ffprobe timed out while analyzing {file_path.name}")
        except subprocess.CalledProcessError as e:
            logger.error(f"ffprobe failed on {file_path.name}: {e.stderr}")
            raise ValueError(f"Corrupted or unreadable media file: {e.stderr.strip()[:200]}")
        except json.JSONDecodeError as e:
            logger.error(f"ffprobe returned non-JSON output for {file_path.name}: {e}")
            raise ValueError(f"Unable to parse media metadata for {file_path.name}")

        format_info = data.get("format", {})
        streams = data.get("streams", [])

        video_streams = [s for s in streams if s.get("codec_type") == "video"]
        audio_streams = [s for s in streams if s.get("codec_type") == "audio"]

        duration = float(format_info.get("duration", 0.0))
        if duration == 0.0 and video_streams:
            duration = float(video_streams[0].get("duration", 0.0))
        if duration == 0.0 and audio_streams:
            duration = float(audio_streams[0].get("duration", 0.0))

        v_info = None
        if video_streams:
            vs = video_streams[0]
            # FPS calculation
            fps_str = vs.get("r_frame_rate", "30/1")
            try:
                num, den = map(int, fps_str.split("/"))
                fps = round(num / den, 2) if den != 0 else 30.0
            except Exception:
                fps = 30.0

            v_info = {
                "codec": vs.get("codec_name", "unknown"),
                "width": int(vs.get("width", 0)),
                "height": int(vs.get("height", 0)),
                "fps": fps,
                "duration": float(vs.get("duration", duration)),
            }

        a_info = None
        if audio_streams:
            as_ = audio_streams[0]
            a_info = {
                "codec": as_.get("codec_name", "unknown"),
                "sample_rate": int(as_.get("sample_rate", 44100)),
                "channels": int(as_.get("channels", 2)),
                "duration": float(as_.get("duration", duration)),
            }

        return {
            "filename": file_path.name,
            "format_name": format_info.get("format_name", "unknown"),
            "duration": round(duration, 3),
            "size_bytes": int(format_info.get("size", file_path.stat().st_size)),
            "bit_rate": int(format_info.get("bit_rate", 0)),
            "has_video": len(video_streams) > 0,
            "has_audio": len(audio_streams) > 0,
            "video": v_info,
            "audio": a_info,
        }

    def extract_audio(
        self,
        input_file: Path,
        output_file: Path,
        sample_rate: int = 16000,
        channels: int = 1,
    ) -> Path:
        """Extract uncompressed 16-bit PCM WAV audio from any container for ASR and processing."""
        output_file.parent.mkdir(parents=True, exist_ok=True)
        cmd = [
            self.ffmpeg_path,
            "-y",
            "-i", str(input_file),
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", str(sample_rate),
            "-ac", str(channels),
            str(output_file),
        ]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=120)
            logger.info(f"Extracted audio from {input_file.name} to {output_file.name} ({sample_rate}Hz, {channels}ch)")
            return output_file
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg audio extraction failed: {e.stderr}")
            raise RuntimeError(f"Audio extraction failed: {e.stderr.strip()[:200]}")

    def extract_frames(
        self,
        video_file: Path,
        output_dir: Path,
        fps: Optional[float] = None,
        max_frames: Optional[int] = None,
    ) -> List[Path]:
        """Extract video frames as PNG/JPG sequence for lip-sync and face processing."""
        output_dir.mkdir(parents=True, exist_ok=True)
        out_pattern = output_dir / "frame_%06d.jpg"

        cmd = [self.ffmpeg_path, "-y", "-i", str(video_file)]
        if fps:
            cmd.extend(["-r", str(fps)])
        if max_frames:
            cmd.extend(["-vframes", str(max_frames)])
        cmd.extend(["-q:v", "2", str(out_pattern)])

        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=180)
            frames = sorted(list(output_dir.glob("frame_*.jpg")))
            logger.info(f"Extracted {len(frames)} frames from {video_file.name} into {output_dir.name}")
            return frames
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg frame extraction failed: {e.stderr}")
            raise RuntimeError(f"Frame extraction failed: {e.stderr.strip()[:200]}")

    def mix_audio_tracks(
        self,
        dubbed_audio: Path,
        original_audio: Optional[Path],
        output_file: Path,
        dubbed_volume: float = 1.0,
        background_volume: float = 0.2,
    ) -> Path:
        """Mix generated target-language dubbed speech with attenuated background music/ambience."""
        output_file.parent.mkdir(parents=True, exist_ok=True)
        if not original_audio or not original_audio.exists() or background_volume <= 0.01:
            # Only dubbed audio needed
            shutil.copyfile(dubbed_audio, output_file)
            return output_file

        cmd = [
            self.ffmpeg_path,
            "-y",
            "-i", str(dubbed_audio),
            "-i", str(original_audio),
            "-filter_complex",
            f"[0:a]volume={dubbed_volume}[a0];[1:a]volume={background_volume}[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]",
            "-map", "[aout]",
            "-acodec", "pcm_s16le",
            "-ar", "44100",
            str(output_file),
        ]

        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=120)
            return output_file
        except subprocess.CalledProcessError as e:
            logger.warning(f"Audio mixing failed, falling back to dubbed audio only: {e.stderr}")
            shutil.copyfile(dubbed_audio, output_file)
            return output_file

    def create_synthetic_test_video(
        self,
        output_path: Path,
        duration_s: float = 3.0,
        width: int = 640,
        height: int = 480,
        fps: int = 25,
    ) -> Path:
        """Generate a deterministic, 100% royalty-free synthetic MP4 with color test bars and sine tone for testing."""
        output_path.parent.mkdir(parents=True, exist_ok=True)
        cmd = [
            self.ffmpeg_path,
            "-y",
            "-f", "lavfi",
            "-i", f"smptebars=size={width}x{height}:rate={fps}",
            "-f", "lavfi",
            "-i", "sine=frequency=440:sample_rate=16000",
            "-t", str(duration_s),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "128k",
            str(output_path),
        ]
        subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=60)
        return output_path

media_service = MediaService()
