import os
import shutil
import uuid
from pathlib import Path
from typing import Optional, Tuple
from app.core.config import settings
from app.core.logging import logger

class StorageService:
    def __init__(self):
        self.audio_dir = Path(settings.AUDIO_STORAGE_DIR).resolve()
        self.media_dir = Path(settings.MEDIA_STORAGE_DIR).resolve()
        self.video_dir = Path(settings.VIDEO_STORAGE_DIR).resolve()
        self.subtitle_dir = Path(settings.SUBTITLE_STORAGE_DIR).resolve()
        self.dataset_dir = Path(settings.DATASET_STORAGE_DIR).resolve()
        self.model_dir = Path(settings.MODELS_STORAGE_DIR).resolve()
        self.scratch_dir = Path(settings.SCRATCH_STORAGE_DIR).resolve()

        # Initialize all storage directories
        for d in [
            self.audio_dir,
            self.media_dir,
            self.video_dir,
            self.subtitle_dir,
            self.dataset_dir,
            self.model_dir,
            self.scratch_dir,
        ]:
            d.mkdir(parents=True, exist_ok=True)

        logger.info(f"StorageService initialized with audio_dir={self.audio_dir}, media_dir={self.media_dir}")

    @property
    def base_dir(self) -> Path:
        """Backward compatibility for existing callers expecting self.base_dir to point to audio dir."""
        return self.audio_dir

    def get_free_disk_mb(self, path: Optional[Path] = None) -> float:
        """Get available free disk space in megabytes for the storage volume."""
        target = path or self.audio_dir
        try:
            total, used, free = shutil.disk_usage(str(target))
            return free / (1024 * 1024)
        except Exception as e:
            logger.warning(f"Failed to check disk usage on {target}: {e}")
            return 999999.0

    def assert_disk_space(self, required_mb: int = 10, target_path: Optional[Path] = None):
        """Raise an error if free disk is lower than minimum required space."""
        free_mb = self.get_free_disk_mb(target_path)
        min_allowed = max(settings.MIN_FREE_DISK_MB, required_mb)
        if free_mb < min_allowed:
            msg = (
                f"Insufficient disk space: {free_mb:.1f} MB remaining, "
                f"which is below safety threshold of {min_allowed} MB."
            )
            logger.error(msg)
            raise IOError(msg)

    def save_audio_bytes(self, data: bytes, format: str = "wav") -> Tuple[str, int]:
        file_id = f"{uuid.uuid4().hex}.{format}"
        target_path = self.audio_dir / file_id
        with open(target_path, "wb") as f:
            f.write(data)
        file_size = len(data)
        return file_id, file_size

    def save_media_bytes(self, data: bytes, filename: str) -> Tuple[str, int]:
        ext = os.path.splitext(filename)[1].lstrip(".").lower() or "bin"
        file_id = f"{uuid.uuid4().hex}.{ext}"
        target_path = self.media_dir / file_id
        with open(target_path, "wb") as f:
            f.write(data)
        return file_id, len(data)

    def save_video_bytes(self, data: bytes, format: str = "mp4") -> Tuple[str, int]:
        file_id = f"{uuid.uuid4().hex}.{format}"
        target_path = self.video_dir / file_id
        with open(target_path, "wb") as f:
            f.write(data)
        return file_id, len(data)

    def save_subtitle_text(self, text: str, format: str = "srt") -> Tuple[str, int]:
        file_id = f"{uuid.uuid4().hex}.{format}"
        target_path = self.subtitle_dir / file_id
        data = text.encode("utf-8")
        with open(target_path, "wb") as f:
            f.write(data)
        return file_id, len(data)

    def get_audio_path(self, storage_key: str) -> Optional[Path]:
        return self._resolve_safe_path(self.audio_dir, storage_key)

    def get_media_path(self, storage_key: str) -> Optional[Path]:
        return self._resolve_safe_path(self.media_dir, storage_key)

    def get_video_path(self, storage_key: str) -> Optional[Path]:
        return self._resolve_safe_path(self.video_dir, storage_key)

    def get_subtitle_path(self, storage_key: str) -> Optional[Path]:
        return self._resolve_safe_path(self.subtitle_dir, storage_key)

    def _resolve_safe_path(self, base_folder: Path, key: str) -> Optional[Path]:
        # Strict path traversal prevention
        cleaned_key = os.path.basename(key)
        target = (base_folder / cleaned_key).resolve()
        if not str(target).startswith(str(base_folder)):
            logger.warning(f"Path traversal blocked: {key} attempted against {base_folder}")
            return None
        if not target.exists():
            return None
        return target

    def delete_audio(self, storage_key: str) -> bool:
        path = self.get_audio_path(storage_key)
        if path and path.exists():
            try:
                path.unlink()
                return True
            except Exception as e:
                logger.error(f"Failed to delete audio file {path}: {e}")
                return False
        return False

    def delete_file(self, folder_type: str, storage_key: str) -> bool:
        resolver = {
            "audio": self.get_audio_path,
            "media": self.get_media_path,
            "video": self.get_video_path,
            "subtitles": self.get_subtitle_path,
        }.get(folder_type)
        if not resolver:
            return False
        path = resolver(storage_key)
        if path and path.exists():
            try:
                path.unlink()
                return True
            except Exception as e:
                logger.error(f"Failed to delete {folder_type} file {path}: {e}")
                return False
        return False

    def create_scratch_dir(self, prefix: str = "job_") -> Path:
        scratch = self.scratch_dir / f"{prefix}{uuid.uuid4().hex}"
        scratch.mkdir(parents=True, exist_ok=True)
        return scratch

    def cleanup_scratch_dir(self, scratch_path: Path):
        try:
            if scratch_path.exists() and str(scratch_path).startswith(str(self.scratch_dir)):
                shutil.rmtree(scratch_path, ignore_errors=True)
        except Exception as e:
            logger.warning(f"Failed to cleanup scratch directory {scratch_path}: {e}")

storage_service = StorageService()
