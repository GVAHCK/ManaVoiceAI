import os
import json
import yaml
import shutil
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from app.core.config import settings
from app.core.logging import logger
from app.services.storage_service import storage_service

class KaggleService:
    def __init__(self):
        self.registry_path = Path(settings.DATASET_REGISTRY_PATH).resolve()
        self.dataset_base_dir = Path(settings.DATASET_STORAGE_DIR).resolve()
        self.dataset_base_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"KaggleService initialized with registry={self.registry_path}")

    def has_credentials(self) -> bool:
        """Check if official Kaggle credentials are present in env or ~/.kaggle/kaggle.json."""
        if settings.KAGGLE_USERNAME and settings.KAGGLE_KEY:
            return True
        if os.environ.get("KAGGLE_USERNAME") and os.environ.get("KAGGLE_KEY"):
            return True
        kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
        return kaggle_json.exists()

    def get_registered_datasets(self) -> List[Dict[str, Any]]:
        """Read registered verified datasets from configs/datasets.yaml."""
        if not self.registry_path.exists():
            return []
        try:
            with open(self.registry_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                return data.get("datasets", [])
        except Exception as e:
            logger.error(f"Failed to read dataset registry: {e}")
            return []

    async def search_datasets(self, query: str = "speech") -> Dict[str, Any]:
        """Search Kaggle datasets via API if configured, otherwise search local registry."""
        registered = self.get_registered_datasets()
        matching = [
            d for d in registered
            if query.lower() in d["name"].lower()
            or query.lower() in d["task_type"].lower()
            or any(query.lower() in lang.lower() for lang in d.get("languages", []))
        ]

        if not self.has_credentials():
            return {
                "source": "verified_registry_offline",
                "authenticated": False,
                "message": "Kaggle credentials not configured in .env. Showing verified curated datasets.",
                "total": len(matching) if matching else len(registered),
                "datasets": matching if matching else registered,
            }

        # Query Kaggle API if credentials exist
        try:
            import kaggle
            kaggle.api.authenticate()

            def _search():
                results = kaggle.api.dataset_list(search=query)
                return [
                    {
                        "id": f"{d.ref.replace('/', '-')}",
                        "name": d.title,
                        "provider": d.ref.split("/")[0],
                        "verified_identifier": d.ref,
                        "version": getattr(d, "currentVersionNumber", "1"),
                        "task_type": "multilingual_audio_ml",
                        "download_source": "kaggle",
                        "license": getattr(d, "licenseName", "Unknown"),
                        "approximate_size_mb": round(getattr(d, "totalBytes", 0) / (1024 * 1024), 2),
                        "download_status": "discoverable",
                    }
                    for d in results[:10]
                ]

            api_results = await asyncio.to_thread(_search)
            return {
                "source": "kaggle_api_live",
                "authenticated": True,
                "total": len(api_results),
                "datasets": api_results,
            }
        except Exception as e:
            logger.warning(f"Kaggle API query failed ({e}), returning registered datasets: {e}")
            return {
                "source": "verified_registry_fallback",
                "authenticated": True,
                "error": str(e),
                "total": len(registered),
                "datasets": registered,
            }

    async def download_dataset(
        self,
        dataset_id: str,
        max_size_mb: int = 500,
    ) -> Dict[str, Any]:
        """Storage-aware dataset download with disk space protection and verification."""
        # Find dataset in registry
        registered = self.get_registered_datasets()
        found = next((d for d in registered if d["id"] == dataset_id or d["verified_identifier"] == dataset_id), None)
        if not found:
            raise ValueError(f"Dataset '{dataset_id}' not found in registered catalog.")

        required_mb = found.get("approximate_size_mb", 100)
        free_mb = storage_service.get_free_disk_mb(self.dataset_base_dir)

        # Enforce storage safety check
        if free_mb < (required_mb + settings.MIN_FREE_DISK_MB):
            raise IOError(
                f"Cannot download dataset '{dataset_id}': Requires {required_mb} MB, but only {free_mb:.1f} MB is available "
                f"(safety threshold requires at least {required_mb + settings.MIN_FREE_DISK_MB} MB free)."
            )

        target_folder = self.dataset_base_dir / found["id"]
        target_folder.mkdir(parents=True, exist_ok=True)

        # If live credentials exist, download genuine dataset files from Kaggle
        if self.has_credentials():
            try:
                import kaggle
                kaggle.api.authenticate()
                logger.info(f"Downloading dataset '{found['verified_identifier']}' via Kaggle API to {target_folder}...")
                await asyncio.to_thread(
                    kaggle.api.dataset_download_files,
                    found["verified_identifier"],
                    path=str(target_folder),
                    unzip=True,
                )
                manifest_path = target_folder / "manifest.json"
                manifest_data = {
                    "dataset_id": found["id"],
                    "verified_identifier": found["verified_identifier"],
                    "task_type": found["task_type"],
                    "languages": found["languages"],
                    "license": found["license"],
                    "source": "kaggle_api_live",
                    "status": "downloaded_and_extracted",
                }
                with open(manifest_path, "w", encoding="utf-8") as f:
                    json.dump(manifest_data, f, indent=2)
                return {
                    "dataset_id": found["id"],
                    "local_path": str(target_folder),
                    "source": "kaggle_api_live",
                    "status": "downloaded_and_verified",
                    "manifest": manifest_data,
                }
            except Exception as e:
                logger.error(f"Live Kaggle download failed for {found['verified_identifier']}: {e}")
                raise RuntimeError(f"Kaggle download error: {str(e)}")

        # Offline mode without credentials: do not claim archive was downloaded
        manifest_path = target_folder / "manifest.json"
        manifest_data = {
            "dataset_id": found["id"],
            "name": found["name"],
            "task_type": found["task_type"],
            "languages": found["languages"],
            "license": found["license"],
            "status": "registered_offline_no_credentials",
            "message": "Kaggle credentials not configured in .env. Live archive download blocked.",
        }
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, indent=2)

        return {
            "dataset_id": found["id"],
            "local_path": str(target_folder),
            "source": "verified_registry_offline",
            "status": "registered_manifest_only",
            "manifest": manifest_data,
        }

kaggle_service = KaggleService()
