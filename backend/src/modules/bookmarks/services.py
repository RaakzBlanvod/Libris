from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.bookmarks.models import Bookmark
from src.modules.bookmarks.schemas import BookmarkCreate, BookmarkStatus
# from src.modules.books.services import BookService


class BookmarkService:
    @staticmethod
    async def toggle_bookmark(
        db: AsyncSession, user_id: int, bookmark_data: BookmarkCreate
    ) -> Bookmark:
        """
        Добавляет или обновляет статус закладки.

        Args:
            db: асинхронная сессия
            user_id: id пользователя
            bookmark_data: схема закладки

        Returns:
            Bookmark: обновленная или созданная закладка
        """
        # 1. Убеждаемся, что книга существует в нашей БД
        # На всякий случай, если юзер как то дернет ручку до создания книги
        # Либо реализуем добавление в закладки в post ручке /books/search
        # await BookService.get_or_create_book(db, bookmark_data.book_id)

        # 2. Ищем, нет ли уже такой закладки у этого юзера
        query = select(Bookmark).where(
            Bookmark.user_id == user_id, Bookmark.book_id == bookmark_data.book_id
        )
        result = await db.execute(query)
        existing_bookmark = result.scalar_one_or_none()

        if existing_bookmark:
            # Если нашли — просто обновляем статус и updated_at (автоматически)
            existing_bookmark.status = bookmark_data.status
            await db.commit()
            await db.refresh(existing_bookmark)
            return existing_bookmark

        # 3. Если нет — создаем новую
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
            db: асинхронная сессия
            user_id: id пользователя
            status: статус закладки

        Returns:
            list[Bookmark]: список закладок
        """
        stmt = select(Bookmark).where(Bookmark.user_id == user_id)

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
            db: асинхронная сессия
            user_id: id пользователя
            book_id: id книги

        Returns:
            bool: True, если закладка была удалена, False иначе
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
