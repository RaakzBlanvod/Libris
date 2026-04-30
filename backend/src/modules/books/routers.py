from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import httpx

from src.core.deps import get_db
from src.modules.books import schemas
from src.modules.books.services import BookService

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
            detail=f"Ошибка Google Books API: {e.response.status_code}"
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="Не удалось подключиться к Google Books API"
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Внутренняя ошибка сервера: {str(e)}")


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
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Книга не найдена в Google Books")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Ошибка при запросе к Google Books API")
    except httpx.RequestError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Не удалось подключиться к Google Books API")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Внутренняя ошибка сервера: {str(e)}")
