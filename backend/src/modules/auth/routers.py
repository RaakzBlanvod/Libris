from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from src.core.database import get_db
from src.modules.users.services import UserService
from src.modules.users.schemas import UserResponse
from . import schemas
from .services import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Creates a new user account with the provided email, username, and password.",
)
async def register_user(
    user_in: schemas.UserRegister,
    db: AsyncSession = Depends(get_db),
):
    try:
        # Используем существующую логику создания юзера
        return await UserService.create_user(db, user_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists",
        )

@router.post(
    "/login",
    response_model=schemas.Token,
    summary="Login for access and refresh tokens",
    description="Authenticates a user and returns JWT tokens.",
)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await AuthService.authenticate_user(
            db, form_data.username, form_data.password
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return await AuthService.create_tokens(db, user)

@router.post(
    "/refresh",
    response_model=schemas.Token,
    summary="Refresh tokens",
    description="Returns a new access and refresh token pair if the provided refresh token is valid.",
)
async def refresh_tokens(
    token_in: schemas.TokenRefresh,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await AuthService.refresh_tokens(db, token_in.refresh_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout user",
    description="Revokes the provided refresh token.",
)
async def logout(
    token_in: schemas.TokenRefresh,
    db: AsyncSession = Depends(get_db)
):
    await AuthService.logout(db, token_in.refresh_token)
    return None
