import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.core.config import settings
from src.modules.users.services import get_user_by_email

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
):
    """
    Dependency для получения текущего пользователя.

    Args:
        db: Асинхронная сессия базы данных.
        token: Токен авторизации.

    Returns:
        Объект пользователя.

    Raises:
        HTTPException: Если токен недействителен.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        token_type: str = payload.get("type")

        if email is None or token_type != "access":
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = await get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception

    return user


oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login", auto_error=False
)


async def get_current_user_optional(
    db: AsyncSession = Depends(get_db),
    token: str | None = Depends(oauth2_scheme_optional),
):
    """
    Dependency для получения текущего пользователя (опционально).
    Для ендпоинтов, которые доступны как аутентифицированным, так и гостям.

    Args:
        db: Асинхронная сессия базы данных.
        token: Токен авторизации.

    Returns:
        Объект пользователя или None.

    Raises:
        HTTPException: Если токен недействителен.
    """
    if not token:
        return None

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        token_type: str = payload.get("type")

        if email is None or token_type != "access":
            return None
    except jwt.PyJWTError:
        return None

    user = await get_user_by_email(db, email=email)
    if user is None:
        return None

    return user
