from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import httpx
import redis.asyncio as redis
import json

from src.core.database import get_db
from src.core.redis import get_redis
from src.modules.books import schemas
from src.modules.books.services import BookService

router = APIRouter(prefix="/books", tags=["Books"])


@router.get(
    "/search",
    response_model=List[schemas.BookShortResponse],
    summary="Поиск книг",
    description="Возвращает список книг, соответствующих поисковому запросу. Использует Google Books API для поиска.",
)
async def search_books(
    q: str = Query(..., min_length=2, max_length=50, description="Поисковый запрос"),
    limit: int = Query(10, ge=1, le=40, description="Количество результатов"),
    db: AsyncSession = Depends(get_db),
):
    try:
        results = await BookService.search_books(db, q, limit)
        return results
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ошибка Google Books API: {e.response.status_code}",
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Не удалось подключиться к Google Books API",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Внутренняя ошибка сервера: {str(e)}",
        )


@router.get(
    "/trending",
    response_model=List[schemas.BookShortResponse],
    summary="Топ книг",
    description="Возвращает список топ книг. Если кэш redis пуст, данные будут получены из PostgreSQL.",
)
async def get_trending_books(
    redis: redis.Redis = Depends(get_redis), db: AsyncSession = Depends(get_db)
):
    cache_key = "dashboard:trending_books"

    cached_books = await redis.get(cache_key)

    if cached_books:
        return Response(content=cached_books, media_type="application/json")

    trending_books = await BookService.get_trending_books(db, limit=10)

    books_json = json.dumps(
        [
            schemas.BookShortResponse.model_validate(b).model_dump(mode="json")
            for b in trending_books
        ],
        ensure_ascii=False,
    )

    await redis.set(cache_key, books_json, ex=3600)

    return Response(content=books_json, media_type="application/json")


@router.get(
    "/{google_id}",
    response_model=schemas.BookDetailResponse,
    summary="Детали книги",
    description="Возвращает детали книги по её Google Books ID.",
)
async def get_book_details(
    google_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        book = await BookService.get_book_by_google_id(db, google_id)
        if not book:
            metadata = await BookService.fetch_single_google_book(google_id)
            book = await BookService.get_or_create_book(db, metadata)
        return book
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except httpx.HTTPStatusError as e:
        # Google Books API возвращает 503 вместо 400/404, если формат ID некорректен (например '1')
        if e.response.status_code in (404, 503):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Книга не найдена в Google Books (или передан неверный ID)",
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Ошибка при запросе к Google Books API",
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Не удалось подключиться к Google Books API",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Внутренняя ошибка сервера: {str(e)}",
        )
