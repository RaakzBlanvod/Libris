from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.users.models import User
from src.modules.users.schemas import UserCreate, UserUpdate
from src.core.security import get_password_hash, verify_password


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


class UserService:
    @staticmethod
    async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
        """
        Создает нового пользователя.

        Args:
            db: Асинхронная сессия базы данных.
            user_in: Объект UserCreate с новыми данными.

        Returns:
            Созданный пользователь.

        Raises:
            ValueError: Если email/username уже существует.
        """
        if await get_user_by_email(db, email=user_in.email):
            raise ValueError("Email already registered")

        if await get_user_by_username(db, username=user_in.username):
            raise ValueError("Username already taken")

        db_user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=get_password_hash(user_in.password),
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
        """
        Аутентифицирует пользователя по email и паролю.

        Args:
            db: Асинхронная сессия базы данных.
            email: Email пользователя.
            password: Пароль пользователя.

        Returns:
            Пользователь, если аутентификация прошла успешно.

        Raises:
            ValueError: Если email или пароль неверны.
        """
        user = await get_user_by_email(db, email=email)
        if not user:
            raise ValueError("User not found")
        if not verify_password(password, user.hashed_password):
            raise ValueError("Invalid password")
        return user

    @staticmethod
    async def update_user(db: AsyncSession, user: User, user_in: UserUpdate) -> User:
        """
        Частично обновляет данные пользователя, обновляя только переданные поля.

        Args:
            db: Асинхронная сессия базы данных.
            user: Текущий пользователь, которого нужно обновить.
            user_in: Объект UserUpdate с новыми данными (Возможные поля можно посмотреть в UserUpdate).

        Returns:
            Обновленный пользователь.

        Raises:
            ValueError: Если email/username уже существует, или если пароль не был изменен.
        """
        update_data = user_in.model_dump(exclude_unset=True)

        if not update_data:
            # Если передано не было ни одного поля, возвращаем текущего юзера
            return user

        if "email" in update_data:
            existing_user = await get_user_by_email(db, email=update_data["email"])
            if existing_user and existing_user.id != user.id:
                raise ValueError("Email already registered")

        if "username" in update_data:
            existing_user = await get_user_by_username(
                db, username=update_data["username"]
            )
            if existing_user and existing_user.id != user.id:
                raise ValueError("Username already taken")

        if "password" in update_data:
            raw_password = update_data.pop("password")
            if verify_password(raw_password, user.hashed_password):
                raise ValueError("Password is the same as the current password")
            update_data["hashed_password"] = get_password_hash(raw_password)

        for key, value in update_data.items():
            setattr(user, key, value)

        # TODO: Добавить поля bio и avatar_url в модель User, когда они потребуются

        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def delete_user(db: AsyncSession, user: User) -> None:
        """
        Удаляет пользователя из базы данных.

        Args:
            db: Асинхронная сессия базы данных.
            user: Пользователь, которого нужно удалить.

        Returns:
            None
        """
        await db.delete(user)
        await db.commit()
