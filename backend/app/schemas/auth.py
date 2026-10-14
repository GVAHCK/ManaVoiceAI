from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    display_name: str = Field(min_length=2, max_length=50)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    display_name: str
    role: str
    default_source_language: str
    default_target_language: str
    default_model_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=50)
    default_source_language: Optional[str] = None
    default_target_language: Optional[str] = None
    default_model_id: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)
