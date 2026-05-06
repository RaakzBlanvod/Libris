from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import datetime
import jwt
from src.modules.users.models import User
from src.modules.users.services import get_user_by_email
from src.core.security import verify_password, create_access_token, create_refresh_token
from src.modules.auth.schemas import Token
from src.modules.auth.models import RefreshToken
from src.core.config import settings

class AuthService:
    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
        """
        Аутентифицирует пользователя по email и паролю
        
        Args:
            db: асинхронная сессия
            email: email пользователя
            password: пароль пользователя
            
        Returns:
            User: пользователь
        """
        user = await get_user_by_email(db, email=email)
        if not user:
            raise ValueError("User not found")
        if not verify_password(password, user.hashed_password):
            raise ValueError("Invalid password")
        return user

    @staticmethod
    async def create_tokens(db: AsyncSession, user: User) -> Token:
        """
        Создает access token и refresh token
        
        Args:
            db: асинхронная сессия
            user: пользователь
            
        Returns:
            Token: access token и refresh token
        """
        access_token = create_access_token(data={"sub": user.email})
        refresh_token = create_refresh_token(data={"sub": user.email})
        
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        db_token = RefreshToken(
            token=refresh_token,
            user_id=user.id,
            expires_at=expires_at
        )
        db.add(db_token)
        await db.commit()

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )

    @staticmethod
    async def refresh_tokens(db: AsyncSession, refresh_token: str) -> Token:
        """
        Обновляет access token и refresh token
        
        Args:
            db: асинхронная сессия
            refresh_token: refresh token
            
        Returns:
            Token: access token и refresh token
        """
        try:
            payload = jwt.decode(
                refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            email: str = payload.get("sub")
            token_type: str = payload.get("type")
            if email is None or token_type != "refresh":
                raise ValueError("Invalid token")
        except jwt.PyJWTError:
            raise ValueError("Invalid token")

        stmt = select(RefreshToken).where(RefreshToken.token == refresh_token)
        res = await db.execute(stmt)
        db_token = res.scalar_one_or_none()
        
        if not db_token or db_token.is_revoked:
            raise ValueError("Token is revoked or not found")

        user = await get_user_by_email(db, email=email)
        if user is None:
            raise ValueError("User not found")

        db_token.is_revoked = True
        await db.commit()

        return await AuthService.create_tokens(db, user)

    @staticmethod
    async def logout(db: AsyncSession, refresh_token: str) -> None:
        """
        Выходит из системы, отменяя refresh token
        
        Args:
            db: асинхронная сессия
            refresh_token: refresh token
        """
        stmt = select(RefreshToken).where(RefreshToken.token == refresh_token)
        res = await db.execute(stmt)
        db_token = res.scalar_one_or_none()
        
        if db_token and not db_token.is_revoked:
            db_token.is_revoked = True
            await db.commit()
