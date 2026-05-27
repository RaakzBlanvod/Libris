import datetime
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.security import verify_password, create_access_token, create_refresh_token
from src.modules.auth.models import RefreshToken
from src.modules.auth.schemas import Token
from src.modules.users.models import User
from src.modules.users.services import get_user_by_email


class AuthService:
    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
        """
        Аутентифицирует пользователя по email и паролю.

        Args:
            db: Асинхронная сессия базы данных.
            email: Email пользователя.
            password: Пароль пользователя.

        Returns:
            Объект аутентифицированного пользователя.

        Raises:
            ValueError: Если пользователь не найден или пароль неверен.
        """
        user = await get_user_by_email(db, email=email)
        if not user:
            raise ValueError("Пользователь с таким email не найден")

        if not verify_password(password, user.hashed_password):
            raise ValueError("Неверный пароль")

        return user

    @staticmethod
    async def create_tokens(db: AsyncSession, user: User) -> Token:
        """
        Генерирует пару токенов (access и refresh) для пользователя и сохраняет refresh в БД.

        Args:
            db: Асинхронная сессия базы данных.
            user: Объект пользователя.

        Returns:
            Схема Token с обоими токенами.
        """
        access_token = create_access_token(data={"sub": user.email})
        refresh_token = create_refresh_token(data={"sub": user.email})

        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

        db_token = RefreshToken(
            token=refresh_token,
            user_id=user.id,
            expires_at=expires_at,
        )
        db.add(db_token)
        await db.commit()

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
        )

    @staticmethod
    async def refresh_tokens(db: AsyncSession, refresh_token: str) -> Token:
        """
        Проверяет старый refresh токен и выпускает новую пару токенов.

        Args:
            db: Асинхронная сессия базы данных.
            refresh_token: Действующий refresh токен.

        Returns:
            Схема Token с новой парой токенов.

        Raises:
            ValueError: Если токен недействителен, истек или был отозван.
        """
        try:
            payload = jwt.decode(
                refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            email: str = payload.get("sub")
            token_type: str = payload.get("type")

            if email is None or token_type != "refresh":
                raise ValueError("Недействительный токен")
        except jwt.PyJWTError:
            raise ValueError("Недействительный или просроченный токен")

        stmt = select(RefreshToken).where(RefreshToken.token == refresh_token)
        res = await db.execute(stmt)
        db_token = res.scalar_one_or_none()

        if not db_token or db_token.is_revoked:
            raise ValueError("Токен отозван или не найден в базе данных")

        user = await get_user_by_email(db, email=email)
        if user is None:
            raise ValueError("Владелец токена не найден")

        # Отзываем старый токен, чтобы его нельзя было использовать повторно
        db_token.is_revoked = True
        await db.commit()

        return await AuthService.create_tokens(db, user)

    @staticmethod
    async def logout(db: AsyncSession, refresh_token: str) -> None:
        """
        Деактивирует refresh токен, блокируя возможность обновления сессии.

        Args:
            db: Асинхронная сессия базы данных.
            refresh_token: Токен, который нужно отозвать.
        """
        stmt = select(RefreshToken).where(RefreshToken.token == refresh_token)
        res = await db.execute(stmt)
        db_token = res.scalar_one_or_none()

        if db_token and not db_token.is_revoked:
            db_token.is_revoked = True
            await db.commit()
