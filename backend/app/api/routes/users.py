from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import UserResponse, UserUpdateRequest
from app.core.security import get_password_hash
from app.repositories.user_repository import UserRepository
from app.repositories.generation_repository import GenerationRepository
from app.services.storage_service import storage_service
from app.api.deps import get_user_repository, get_generation_repository, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
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

@router.patch("/me", response_model=UserResponse)
async def update_profile(
    updates: UserUpdateRequest,
    current_user: dict = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository),
):
    update_data = {}
    if updates.display_name is not None:
        update_data["display_name"] = updates.display_name
    if updates.default_source_language is not None:
        update_data["default_source_language"] = updates.default_source_language
    if updates.default_target_language is not None:
        update_data["default_target_language"] = updates.default_target_language
    if updates.default_model_id is not None:
        update_data["default_model_id"] = updates.default_model_id
    if updates.password is not None:
        update_data["password_hash"] = get_password_hash(updates.password)

    if not update_data:
        return await get_current_user_profile(current_user)

    updated_user = await user_repo.update(current_user["id"], update_data)
    if not updated_user:
        raise HTTPException(status_code=400, detail="Failed to update user profile")

    return UserResponse(
        id=updated_user["id"],
        email=updated_user["email"],
        display_name=updated_user.get("display_name", "User"),
        role=updated_user.get("role", "user"),
        default_source_language=updated_user.get("default_source_language", "en"),
        default_target_language=updated_user.get("default_target_language", "en"),
        default_model_id=updated_user.get("default_model_id", "facebook/mms-tts-eng"),
        is_active=updated_user.get("is_active", True),
        created_at=updated_user.get("created_at"),
        updated_at=updated_user.get("updated_at"),
    )

@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_account(
    current_user: dict = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository),
    gen_repo: GenerationRepository = Depends(get_generation_repository),
):
    user_id = current_user["id"]
    # Clean up user's generations and audio files
    items, _ = await gen_repo.list_user_generations(user_id=user_id, page=1, page_size=1000)
    for item in items:
        key = item.get("audio_storage_key")
        if key:
            storage_service.delete_audio(key)
        await gen_repo.delete(item["id"], user_id)

    # Delete user account
    await user_repo.delete(user_id)
    return {"message": "User account and all associated data permanently deleted."}
