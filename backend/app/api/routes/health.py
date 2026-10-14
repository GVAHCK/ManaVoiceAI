from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import settings
from app.db.mongodb import get_db, db_manager
from app.services.tts_service import tts_engine

router = APIRouter(tags=["Health"])

@router.get("/health/live", status_code=status.HTTP_200_OK)
async def health_live():
    return {
        "status": "alive",
        "service": "manavoice-ai-backend",
    }

@router.get("/health/ready", status_code=status.HTTP_200_OK)
async def health_ready(db: AsyncIOMotorDatabase = Depends(get_db)):
    db_ok = False
    try:
        # Check database connectivity
        await db.command("ping")
        db_ok = True
    except Exception:
        db_ok = db_manager.is_mock

    tts_ready = tts_engine is not None
    is_ready = db_ok and tts_ready and (not db_manager.is_mock if settings.ENVIRONMENT == "production" else True)

    response_data = {
        "status": "ready" if is_ready and not db_manager.is_mock else ("degraded" if is_ready else "unhealthy"),
        "environment": settings.ENVIRONMENT,
        "database": {
            "connected": db_ok,
            "engine": "in-memory-mock" if db_manager.is_mock else "mongodb",
            "production_ready": not db_manager.is_mock,
        },
        "tts_engine": {
            "ready": tts_ready,
            "default_model": "facebook/mms-tts-eng",
            "device": str(tts_engine.device),
        },
    }

    if not is_ready:
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=response_data)
    return response_data
