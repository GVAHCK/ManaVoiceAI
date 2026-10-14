from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class UserModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    email: str
    password_hash: str
    display_name: str
    role: str = "user"
    default_source_language: str = "en"
    default_target_language: str = "en"
    default_model_id: str = "facebook/mms-tts-eng"
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True)
