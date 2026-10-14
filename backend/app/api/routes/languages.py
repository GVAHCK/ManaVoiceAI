from typing import List
from fastapi import APIRouter
from app.schemas.languages import LanguageCatalogItem
from app.services.tts_service import tts_engine, MODEL_REGISTRY

router = APIRouter(prefix="/languages", tags=["Languages"])

@router.get("", response_model=List[LanguageCatalogItem])
async def list_languages():
    catalog = []
    for code, info in MODEL_REGISTRY.items():
        is_cached = tts_engine.is_model_cached(info["model_id"])
        catalog.append(
            LanguageCatalogItem(
                code=code,
                name=info["name"],
                native_name=info["native_name"],
                tts_supported=True,
                tts_model_id=info["model_id"],
                model_readiness="ready" if is_cached else "downloadable",
                translation_supported=True,
                voices=info["voices"],
                notes=f"{info['notes']} License: {info['license']}",
            )
        )
    return catalog
