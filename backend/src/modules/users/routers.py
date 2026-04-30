from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from src.core.deps import get_current_user
from src.core.database import get_db
from src.core.security import create_access_token
from .services import UserService
from .models import User
from . import schemas

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=schemas.UserResponse,
    summary="Read current user",
    description="Retrieves information about the current authenticated user.",
)
async def read_users_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Creates a new user account with the provided email, username, and password.",
)
async def create_user(
    user_in: schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        return await UserService.create_user(db, user_in)
    except ValueError as e:
        # Если email/username уже существует
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except IntegrityError:
        # Если произошла ошибка целостности данных (одновременная регистрация с одинаковыми данными)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists",
        )


@router.post(
    "/login",
    response_model=schemas.Token,
    summary="Login for access token",
    description="Authenticates a user and returns an access token.",
)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> schemas.Token:
    try:
        user = await UserService.authenticate_user(
            db, form_data.username, form_data.password
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


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
        # Если email/username уже существует
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
