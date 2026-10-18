from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.services.evaluation_service import evaluation_service

router = APIRouter(prefix="/evaluations", tags=["Model Evaluation & Metrics"])

@router.get("/latest")
async def get_latest_evaluations(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Retrieve the latest empirical evaluation report (WER, CER, BLEU, chrF, RTF)."""
    return evaluation_service.get_latest_report()

@router.post("/run")
async def run_system_evaluations(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Execute evaluation benchmark across ASR, Translation, TTS, and Lip-Sync models."""
    try:
        return evaluation_service.run_benchmark_evaluation()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
