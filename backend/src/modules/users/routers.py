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
    summary="Читать профиль текущего пользователя",
    description="Получает расширенную информацию о текущем авторизованном пользователе, включая статистику.",
)
async def read_users_me(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
) -> schemas.UserRead:
    return await UserService.get_user_profile(db, current_user.id)


@router.patch(
    "/me",
    response_model=schemas.UserResponse,
    summary="Обновить текущего пользователя",
    description="Обновляет информацию о текущем авторизованном пользователе. Обновляются только те поля, которые переданы в теле запроса.",
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
    summary="Загрузить аватар пользователя",
    description="Загружает изображение аватара для текущего пользователя. Разрешены форматы JPEG, PNG и WEBP размером до 5 МБ.",
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
    summary="Удалить текущего пользователя",
    description="Удаляет аккаунт текущего авторизованного пользователя. Это необратимая операция.",
)
async def delete_user(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await UserService.delete_user(db, current_user)
    return None
