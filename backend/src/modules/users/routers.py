from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from src.modules.auth.deps import get_current_user
from src.core.database import get_db
from .services import UserService
from .models import User
from . import schemas

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=schemas.UserRead,
    summary="Read current user profile",
    description="Retrieves extended information about the current authenticated user, including statistics.",
)
async def read_users_me(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
) -> schemas.UserRead:
    return await UserService.get_user_profile(db, current_user.id)


@router.patch(
    "/me",
    response_model=schemas.UserResponse,
    summary="Update current user",
    description="Updates the authenticated user's information. Only the fields provided in the request body will be updated.",
)
async def update_user(
    user_in: schemas.UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    try:
        return await UserService.update_user(db, current_user, user_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/me/avatar",
    response_model=schemas.UserResponse,
    summary="Upload user avatar",
    description="Uploads an avatar image for the current user. Only JPEG, PNG, and WEBP formats under 5MB are allowed.",
)
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        await UserService.upload_avatar(db, current_user, file)
        return current_user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete current user",
    description="Deletes the authenticated user account. This action is irreversible.",
)
async def delete_user(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await UserService.delete_user(db, current_user)
    return None
