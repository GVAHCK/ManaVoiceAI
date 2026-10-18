import math
from typing import List, Dict, Any
from pathlib import Path
from app.services.storage_service import storage_service
from app.core.logging import logger

class SubtitleService:
    @staticmethod
    def format_timestamp_srt(seconds: float) -> str:
        """Format seconds to SRT timecode: HH:MM:SS,mmm"""
        hrs = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int(round((seconds - math.floor(seconds)) * 1000))
        return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"

    @staticmethod
    def format_timestamp_vtt(seconds: float) -> str:
        """Format seconds to WebVTT timecode: HH:MM:SS.mmm"""
        hrs = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int(round((seconds - math.floor(seconds)) * 1000))
        return f"{hrs:02d}:{mins:02d}:{secs:02d}.{millis:03d}"

    def generate_srt(self, segments: List[Dict[str, Any]]) -> str:
        """Generate standard SubRip (.srt) subtitle string from timeline segments."""
        lines = []
        for idx, seg in enumerate(segments, 1):
            start_s = float(seg.get("start", 0.0))
            end_s = float(seg.get("end", start_s + 1.0))
            text = seg.get("translated_text") or seg.get("text", "")
            speaker = seg.get("speaker")

            speaker_prefix = f"[{speaker}] " if speaker else ""
            lines.append(str(idx))
            lines.append(f"{self.format_timestamp_srt(start_s)} --> {self.format_timestamp_srt(end_s)}")
            lines.append(f"{speaker_prefix}{text.strip()}")
            lines.append("")

        return "\n".join(lines)

    def generate_vtt(self, segments: List[Dict[str, Any]]) -> str:
        """Generate standard WebVTT (.vtt) subtitle string from timeline segments."""
        lines = ["WEBVTT", ""]
        for idx, seg in enumerate(segments, 1):
            start_s = float(seg.get("start", 0.0))
            end_s = float(seg.get("end", start_s + 1.0))
            text = seg.get("translated_text") or seg.get("text", "")
            speaker = seg.get("speaker")

            speaker_prefix = f"<v {speaker}>" if speaker else ""
            lines.append(str(idx))
            lines.append(f"{self.format_timestamp_vtt(start_s)} --> {self.format_timestamp_vtt(end_s)}")
            lines.append(f"{speaker_prefix}{text.strip()}")
            lines.append("")

        return "\n".join(lines)

    def save_subtitles(self, segments: List[Dict[str, Any]]) -> Dict[str, str]:
        """Generate and save both SRT and VTT files, returning their storage keys."""
        srt_content = self.generate_srt(segments)
        vtt_content = self.generate_vtt(segments)

        srt_key, srt_size = storage_service.save_subtitle_text(srt_content, format="srt")
        vtt_key, vtt_size = storage_service.save_subtitle_text(vtt_content, format="vtt")

        logger.info(f"Saved subtitles: SRT={srt_key} ({srt_size}B), VTT={vtt_key} ({vtt_size}B)")
        return {
            "srt_storage_key": srt_key,
            "vtt_storage_key": vtt_key,
        }

subtitle_service = SubtitleService()
