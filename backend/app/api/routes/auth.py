from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import UserModel
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    RefreshTokenRequest,
)
from app.repositories.user_repository import UserRepository
from app.api.deps import get_user_repository, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    req: RegisterRequest,
    user_repo: UserRepository = Depends(get_user_repository),
):
    existing = await user_repo.get_by_email(req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    pwd_hash = get_password_hash(req.password)
    user_model = UserModel(
        email=req.email,
        password_hash=pwd_hash,
        display_name=req.display_name,
    )
    user = await user_repo.create(user_model)

    access_token = create_access_token({"sub": user["id"], "email": user["email"]})
    refresh_token = create_refresh_token({"sub": user["id"]})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_MINUTES * 60,
        refresh_token=refresh_token,
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    req: LoginRequest,
    user_repo: UserRepository = Depends(get_user_repository),
):
    user = await user_repo.get_by_email(req.email)
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended or deactivated.",
        )

    access_token = create_access_token({"sub": user["id"], "email": user["email"]})
    refresh_token = create_refresh_token({"sub": user["id"]})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_MINUTES * 60,
        refresh_token=refresh_token,
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    req: RefreshTokenRequest,
    user_repo: UserRepository = Depends(get_user_repository),
):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user_id = payload.get("sub")
    user = await user_repo.get_by_id(user_id)
    if not user or not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer active.",
        )

    access_token = create_access_token({"sub": user["id"], "email": user["email"]})
    new_refresh = create_refresh_token({"sub": user["id"]})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_MINUTES * 60,
        refresh_token=new_refresh,
    )

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        display_name=current_user.get("display_name", "User"),
        role=current_user.get("role", "user"),
        default_source_language=current_user.get("default_source_language", "en"),
        default_target_language=current_user.get("default_target_language", "en"),
        default_model_id=current_user.get("default_model_id", "facebook/mms-tts-eng"),
        is_active=current_user.get("is_active", True),
        created_at=current_user.get("created_at"),
        updated_at=current_user.get("updated_at"),
    )
