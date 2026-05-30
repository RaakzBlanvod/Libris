from sqlalchemy.orm import selectinload
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.bookmarks.models import Bookmark
from src.modules.bookmarks.schemas import BookmarkCreate, BookmarkStatus


class BookmarkService:
    @staticmethod
    async def toggle_bookmark(
        db: AsyncSession, user_id: int, bookmark_data: BookmarkCreate
    ) -> Bookmark:
        """
        Добавляет или обновляет статус закладки.

        Args:
            db: Асинхронная сессия базы данных.
            user_id: ID пользователя.
            bookmark_data: Данные закладки.

        Returns:
            Bookmark: Обновленная или созданная закладка.
        """
        query = select(Bookmark).where(
            Bookmark.user_id == user_id, Bookmark.book_id == bookmark_data.book_id
        )
        result = await db.execute(query)
        existing_bookmark = result.scalar_one_or_none()

        if existing_bookmark:
            existing_bookmark.status = bookmark_data.status
            await db.commit()
            await db.refresh(existing_bookmark)
            return existing_bookmark

        new_bookmark = Bookmark(
            user_id=user_id, book_id=bookmark_data.book_id, status=bookmark_data.status
        )
        db.add(new_bookmark)
        await db.commit()
        await db.refresh(new_bookmark)
        return new_bookmark

    @staticmethod
    async def get_user_bookmarks(
        db: AsyncSession, user_id: int, status: BookmarkStatus | None = None
    ) -> list[Bookmark]:
        """
        Получает список всех закладок пользователя.

        Args:
            db: Асинхронная сессия базы данных.
            user_id: ID пользователя.
            status: Фильтр по статусу закладки.

        Returns:
            list[Bookmark]: Список закладок.
        """
        stmt = select(Bookmark).where(Bookmark.user_id == user_id).options(selectinload(Bookmark.book))

        if status:
            stmt = stmt.where(Bookmark.status == status)

        stmt = stmt.order_by(Bookmark.updated_at.desc())

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def delete_bookmark(db: AsyncSession, user_id: int, book_id: int) -> bool:
        """
        Удаляет книгу из закладок пользователя.

        Args:
            db: Асинхронная сессия базы данных.
            user_id: ID пользователя.
            book_id: ID книги.

        Returns:
            bool: True, если закладка была удалена.

        Raises:
            ValueError: Если закладка не найдена.
        """
        query = select(Bookmark).where(
            Bookmark.user_id == user_id, Bookmark.book_id == book_id
        )
        result = await db.execute(query)
        bookmark = result.scalar_one_or_none()

        if not bookmark:
            raise ValueError("Закладка не найдена")

        await db.delete(bookmark)
        await db.commit()
        return True
