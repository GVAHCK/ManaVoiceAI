from typing import List, Optional
from pydantic import BaseModel

class LanguageCatalogItem(BaseModel):
    code: str
    name: str
    native_name: str
    tts_supported: bool
    tts_model_id: Optional[str] = None
    model_readiness: str  # ready, downloadable, unavailable
    translation_supported: bool
    voices: List[str]
    notes: str
