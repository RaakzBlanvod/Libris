import httpx
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.config import settings
from .models import Book, Author, Genre
from .schemas import GoogleBookMetadata, BookShortResponse


class BookService:
    @staticmethod
    async def _fetch_from_google(query: str, limit: int) -> List[GoogleBookMetadata]:
        """
        Args:
            query: Запрос для поиска книг.
            limit: Максимальное количество результатов.

        Returns:
            Список метаданных книг.

        Raises:
            ValueError: Если запрос для поиска книг не был предоставлен.
            httpx.HTTPStatusError: Если запрос к Google Books API завершился с ошибкой.
        """
        if not query:
            raise ValueError("Запрос для поиска книг не был предоставлен.")
            
        url = "https://www.googleapis.com/books/v1/volumes"
        params = {
            "q": query,
            "key": settings.GOOGLE_BOOKS_API_KEY,
            "maxResults": limit,
            "langRestrict": "ru",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        books_metadata = []
        for item in data.get("items", []):
            v_info = item.get("volumeInfo", {})
            # Собираем данные в нашу промежуточную схему
            books_metadata.append(
                GoogleBookMetadata(
                    google_id=item.get("id"),
                    title=v_info.get("title", "Без названия"),
                    authors=v_info.get("authors", ["Неизвестный автор"]),
                    description=v_info.get("description"),
                    thumbnail_url=v_info.get("imageLinks", {}).get("thumbnail"),
                    page_count=v_info.get("pageCount"),
                    isbn=v_info.get("industryIdentifiers", [{}])[0].get("identifier"),
                )
            )
        return books_metadata

    @staticmethod
    async def _fetch_single_google_book(google_id: str) -> GoogleBookMetadata:
        """
        Args:
            google_id: Google Book ID.

        Returns:
            Метаданные книги.

        Raises:
            ValueError: Если Google Book ID не был предоставлен.
            httpx.HTTPStatusError: Если запрос к Google Books API завершился с ошибкой.
        """
        if not google_id:
            raise ValueError("Google Book ID не был предоставлен.")
            
        url = f"https://www.googleapis.com/books/v1/volumes/{google_id}"
        params = {
            "key": settings.GOOGLE_BOOKS_API_KEY,
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        v_info = data.get("volumeInfo", {})
        return GoogleBookMetadata(
            google_id=google_id,
            title=v_info.get("title", "Без названия"),
            authors=v_info.get("authors", ["Неизвестный автор"]),
            description=v_info.get("description"),
            thumbnail_url=v_info.get("imageLinks", {}).get("thumbnail"),
            page_count=v_info.get("pageCount"),
            isbn=v_info.get("industryIdentifiers", [{}])[0].get("identifier"),
            categories=v_info.get("categories", []),
            publisher=v_info.get("publisher"),
            published_date=v_info.get("publishedDate"),
        )

    @staticmethod
    async def search_books(
        db: AsyncSession, query: str, limit: int = 10
    ) -> List[BookShortResponse]:
        """
        Args:
            db: Асинхронная сессия базы данных.
            query: Запрос для поиска книг.
            limit: Максимальное количество результатов.

        Returns:
            Список кратких ответов на книги.

        Raises:
            ValueError: Если запрос для поиска книг не был предоставлен.
        """
        if not query:
            raise ValueError("Запрос для поиска книг не был предоставлен.")
            
        google_results = await BookService._fetch_from_google(query, limit)

        # Собираем все google_id из результатов поиска
        google_ids = [b.google_id for b in google_results]

        # Одним запросом проверяем, какие из этих книг уже есть в нашей БД
        stmt = (
            select(Book)
            .where(Book.google_id.in_(google_ids))
            .options(selectinload(Book.authors))
        )
        result = await db.execute(stmt)
        existing_books = {b.google_id: b for b in result.scalars().all()}

        final_results = []
        for meta in google_results:
            if meta.google_id in existing_books:
                # Если книга есть — отдаем её данные из БД (с нашим id)
                db_book = existing_books[meta.google_id]
                final_results.append(BookShortResponse.model_validate(db_book))
            else:
                # Если книги нет — отдаем "сырые" данные, id будет None
                # Нам нужно вручную собрать AuthorResponse для схемы
                final_results.append(
                    BookShortResponse(
                        id=None,
                        google_id=meta.google_id,
                        title=meta.title,
                        authors=[
                            {"name": a} for a in meta.authors
                        ],  # Заглушка для авторов
                        cover_url=meta.thumbnail_url,
                    )
                )
        return final_results

    @staticmethod
    async def get_or_create_book(
        db: AsyncSession, metadata: GoogleBookMetadata
    ) -> Book:
        """
        Args:
            db: Асинхронная сессия базы данных.
            metadata: Метаданные книги, полученные из Google Books API.

        Returns:
            Объект Book, который существует в базе данных или был только что создан.

        Raises:
            ValueError: Если метаданные книги не были предоставлены.
        """
        if not metadata:
            raise ValueError("Метаданные книги не были предоставлены.")
            
        # 1. Ищем книгу
        stmt = select(Book).where(Book.google_id == metadata.google_id)
        result = await db.execute(stmt)
        book = result.scalar_one_or_none()

        if book:
            return book

        # 2. Обрабатываем авторов (чтобы не дублировать)
        author_objs = []
        for auth_name in metadata.authors:
            # Ищем автора по имени
            a_stmt = select(Author).where(Author.name == auth_name)
            a_res = await db.execute(a_stmt)
            author = a_res.scalar_one_or_none()

            if not author:
                author = Author(name=auth_name)
                db.add(author)
            author_objs.append(author)

        # 3. Обрабатываем жанры
        genre_objs = []
        for genre_name in metadata.categories:
            g_stmt = select(Genre).where(Genre.name == genre_name)
            g_res = await db.execute(g_stmt)
            genre = g_res.scalar_one_or_none()

            if not genre:
                genre = Genre(name=genre_name)
                db.add(genre)
            genre_objs.append(genre)

        # 4. Создаем книгу
        new_book = Book(
            google_id=metadata.google_id,
            title=metadata.title,
            description=metadata.description,
            cover_url=metadata.thumbnail_url,
            page_count=metadata.page_count,
            isbn=metadata.isbn,
            authors=author_objs,  # SQLAlchemy сама проставит связи в M2M таблице
            genres=genre_objs,  # SQLAlchemy сама проставит связи в M2M таблице
        )

        db.add(new_book)
        await db.commit()
        await db.refresh(new_book)
        return new_book

    @staticmethod
    async def get_book_by_google_id(db: AsyncSession, google_id: str) -> Optional[Book]:
        """
        Args:
            db: Асинхронная сессия базы данных.
            google_id: Google Book ID.

        Returns:
            Объект Book, найденный по Google Book ID.
        """
        if not google_id:
            raise ValueError("Google Book ID не был предоставлен.")
            
        stmt = (
            select(Book)
            .where(Book.google_id == google_id)
            .options(
                selectinload(Book.authors),
                selectinload(Book.genres)
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
