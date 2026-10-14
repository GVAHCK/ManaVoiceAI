from typing import List, Optional
from pydantic import BaseModel
from app.schemas.speech import GenerationResponse

class HistoryListResponse(BaseModel):
    items: List[GenerationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
