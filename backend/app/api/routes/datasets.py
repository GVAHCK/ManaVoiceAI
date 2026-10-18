from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.services.kaggle_service import kaggle_service

router = APIRouter(prefix="/datasets", tags=["Dataset Management & Kaggle"])

class DownloadDatasetRequest(BaseModel):
    dataset_id: str
    max_size_mb: int = 500

@router.get("")
async def list_registered_datasets(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """List all registered and discoverable datasets from configs/datasets.yaml."""
    datasets = kaggle_service.get_registered_datasets()
    return {
        "authenticated_kaggle": kaggle_service.has_credentials(),
        "total": len(datasets),
        "datasets": datasets,
    }

@router.get("/search")
async def search_datasets(
    q: str = Query("speech", description="Search query for datasets"),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Search Kaggle datasets live if credentials are set, or search registered catalog."""
    return await kaggle_service.search_datasets(query=q)

@router.post("/download")
async def download_dataset(
    req: DownloadDatasetRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Download and register a verified dataset with disk-space safety checks."""
    try:
        res = await kaggle_service.download_dataset(
            dataset_id=req.dataset_id,
            max_size_mb=req.max_size_mb,
        )
        return res
    except (ValueError, IOError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
