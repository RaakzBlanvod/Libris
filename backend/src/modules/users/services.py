from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
import os
import uuid

from src.modules.users.models import User
from src.modules.users.schemas import UserCreate, UserUpdate, UserRead
from src.modules.reviews.models import Review
from src.modules.bookmarks.models import Bookmark
from src.modules.bookmarks.schemas import BookmarkStatus

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

        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def delete_user(db: AsyncSession, user: User) -> None:
        """
        Удаляет пользователя из базы данных.
        """
        await db.delete(user)
        await db.commit()

    @staticmethod
    async def get_user_profile(db: AsyncSession, user_id: int):

        reviews_subq = (
            select(func.count(Review.id))
            .where(Review.user_id == user_id)
            .scalar_subquery()
        )

        bookmarks_subq = (
            select(func.count(Bookmark.id))
            .where(
                (Bookmark.user_id == user_id)
                & (Bookmark.status == BookmarkStatus.FINISHED)
            )
            .scalar_subquery()
        )

        stmt = select(
            User,
            reviews_subq.label("reviews_count"),
            bookmarks_subq.label("read_books_count"),
        ).where(User.id == user_id)

        result = await db.execute(stmt)
        row = result.first()
        if not row:
            raise ValueError("User not found")

        user, reviews_count, read_books_count = row

        return UserRead(
            id=user.id,
            username=user.username,
            bio=user.bio,
            avatar=user.avatar,
            favorite_genres=user.favorite_genres,
            reviews_count=reviews_count or 0,
            read_books_count=read_books_count or 0,
        )

    @staticmethod
    async def upload_avatar(db: AsyncSession, user: User, file) -> str:

        ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
        MAX_SIZE = 5 * 1024 * 1024  # 5 MB

        if file.content_type not in ALLOWED_TYPES:
            raise ValueError("Разрешены только форматы JPEG, PNG или WEBP")

        file_bytes = await file.read()
        if len(file_bytes) > MAX_SIZE:
            raise ValueError("Размер файла не должен превышать 5 МБ")

        os.makedirs("src/static/avatars", exist_ok=True)

        ext = file.filename.split(".")[-1] if "." in file.filename else "png"
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join("src/static/avatars", filename)

        with open(filepath, "wb") as out_file:
            out_file.write(file_bytes)

        avatar_url = f"/static/avatars/{filename}"
        user.avatar = avatar_url
        await db.commit()
        await db.refresh(user)

        return avatar_url
