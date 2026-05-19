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
from src.core.scheduler import update_dashboard_cache_task

router = APIRouter(prefix="/books", tags=["Books"])


@router.get("/search", response_model=List[schemas.BookShortResponse])
async def search_books(
    q: str = Query(..., min_length=2, max_length=50, description="Поисковой запрос"),
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
    summary="Get trending books",
)
async def get_trending_books(
    redis: redis.Redis = Depends(get_redis), db: AsyncSession = Depends(get_db)
):
    """
    Возвращает список популярных книг.
    Сначала проверяет кэш Redis. Если пусто — идет в PostgreSQL.
    """
    cache_key = "dashboard:trending_books"

    # 1. Пытаемся забрать готовый JSON из кэша
    cached_books = await redis.get(cache_key)

    if cached_books:
        # Кэш найден! Отдаем как есть, экономя время процессора
        return Response(content=cached_books, media_type="application/json")

    # 2. Кэша нет (Cache Miss) - идем в базу данных
    trending_books = await BookService.get_trending_books(db, limit=10)

    # Сериализуем данные в JSON-строку
    books_json = json.dumps(
        [
            schemas.BookShortResponse.model_validate(b).model_dump(mode="json")
            for b in trending_books
        ],
        ensure_ascii=False,
    )

    # 3. Сохраняем в Redis на 1 час (3600 секунд)
    await redis.set(cache_key, books_json, ex=3600)

    # Отдаем ответ клиенту
    return Response(content=books_json, media_type="application/json")


@router.get("/{google_id}", response_model=schemas.BookDetailResponse)
async def get_book_details(
    google_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        book = await BookService.get_book_by_google_id(db, google_id)
        if not book:
            metadata = await BookService._fetch_single_google_book(google_id)
            book = await BookService.get_or_create_book(db, metadata)
        return book
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Книга не найдена в Google Books",
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


@router.post("/test-trigger-scheduler", tags=["System / Test"])
async def test_trigger_scheduler():
    """
    Временный эндпоинт для ручного запуска планировщика.
    Вызывает функцию обновления кэша прямо сейчас.
    """
    try:
        await update_dashboard_cache_task()
        return {"status": "success", "message": "Расчет топов запущен и кэш обновлен!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
