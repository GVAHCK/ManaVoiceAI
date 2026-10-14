import os
import uuid
from pathlib import Path
from typing import Optional, Tuple
from app.core.config import settings
from app.core.logging import logger

class StorageService:
    def __init__(self):
        self.base_dir = Path(settings.AUDIO_STORAGE_DIR).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"StorageService initialized at {self.base_dir}")

    def save_audio_bytes(self, data: bytes, format: str = "wav") -> Tuple[str, int]:
        file_id = f"{uuid.uuid4().hex}.{format}"
        target_path = self.base_dir / file_id
        with open(target_path, "wb") as f:
            f.write(data)
        file_size = len(data)
        return file_id, file_size

    def get_audio_path(self, storage_key: str) -> Optional[Path]:
        # Path traversal prevention
        cleaned_key = os.path.basename(storage_key)
        target_path = (self.base_dir / cleaned_key).resolve()
        if not str(target_path).startswith(str(self.base_dir)):
            logger.warning(f"Potential path traversal attempt with key: {storage_key}")
            return None
        if not target_path.exists():
            return None
        return target_path

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

storage_service = StorageService()
