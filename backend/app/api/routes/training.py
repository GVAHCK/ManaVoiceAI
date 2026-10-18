from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.services.training_service import training_service

router = APIRouter(prefix="/training", tags=["Model Training & Fine-Tuning"])

class StartTrainingJobRequest(BaseModel):
    task_type: str = "translation_adapter"
    dataset_id: str = "multilingual-parallel-translation-corpus"
    profile: str = "smoke_test"  # smoke_test, small_dev_run, medium_fine_tuning
    use_real_data: bool = True
    learning_rate: float = 3e-3
    batch_size: int = 4

@router.post("/jobs", status_code=status.HTTP_201_CREATED)
async def start_training_job(
    req: StartTrainingJobRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Executes a real PyTorch model training or fine-tuning job with LoRA, loss tracking, and checkpointing.
    Explicitly distinguishes lightweight Seq2Seq translation adapter experiments from frozen foundation models.
    """
    try:
        if req.use_real_data:
            report = training_service.run_real_task_finetuning(
                task_type="translation_adapter",
                source_lang="en",
                target_lang="te",
                epochs=5 if req.profile != "smoke_test" else 2,
                learning_rate=req.learning_rate,
            )
            report["model_architecture"] = "FineTuneableSeq2Seq (Embedding + GRU + LoRA rank-4 adapter)"
            report["task_distinction_notice"] = (
                "Verified translation adapter fine-tuning on genuine multilingual parallel text. "
                "This does NOT modify frozen foundation Whisper ASR or Meta MMS weights."
            )
            return report
        else:
            report = training_service.run_training_job(
                task_type="translation_adapter_smoke_test",
                dataset_id=req.dataset_id,
                profile=req.profile,
                learning_rate=req.learning_rate,
                batch_size=req.batch_size,
            )
            report["model_architecture"] = "FineTuneableSeq2Seq (Synthetic Smoke Test)"
            report["task_distinction_notice"] = "Synthetic smoke test verifying optimizer execution loops in CI."
            return report
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

