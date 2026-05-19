from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import json
import redis.asyncio as redis

from src.core.database import get_db
from src.core.redis import get_redis
from src.core.scheduler import update_dashboard_cache_task
from src.modules.auth.deps import get_current_user, get_current_user_optional
from src.modules.users.models import User
from . import schemas
from .services import ReviewService

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post(
    "/", response_model=schemas.ReviewResponse, status_code=status.HTTP_201_CREATED
)
async def create_review(
    book_id: int,
    review_in: schemas.ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Оставить новую рецензию на книгу.
    """
    try:
        return await ReviewService.create_review(db, current_user.id, book_id, review_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/book/{book_id}", response_model=List[schemas.ReviewResponse])
async def get_book_reviews(
    book_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """
    Получить все отзывы к конкретной книге.
    """
    return await ReviewService.get_book_reviews(
        db, book_id, current_user.id if current_user else None
    )


@router.get("/my", response_model=List[schemas.MyReviewResponse])
async def get_my_reviews(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Получить список всех рецензий текущего пользователя.
    """
    return await ReviewService.get_my_reviews(db, current_user.id)


@router.patch("/{review_id}", response_model=schemas.ReviewResponse)
async def update_review(
    review_id: int,
    review_in: schemas.ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return await ReviewService.update_review(
            db, review_id, current_user.id, review_in
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        await ReviewService.delete_review(db, review_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{review_id}/like")
async def like_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return await ReviewService.toggle_like(db, current_user.id, review_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/trending",
    response_model=List[schemas.ReviewResponse],
    summary="Get trending reviews",
)
async def get_trending(
    redis: redis.Redis = Depends(get_redis), db: AsyncSession = Depends(get_db)
):
    """
    Возвращает список самых залайканных рецензий за последние 7 дней.
    Сначала проверяет кэш Redis. Если пусто — идет в PostgreSQL.
    """
    cache_key = "dashboard:trending_reviews"

    # 1. Пытаемся забрать готовый JSON из кэша
    cached_reviews = await redis.get(cache_key)

    if cached_reviews:
        return Response(content=cached_reviews, media_type="application/json")

    # 2. Кэша нет (Cache Miss) - идем в базу данных
    trending_reviews = await ReviewService.get_trending_reviews(db, limit=10)

    # Сериализуем данные в JSON-строку
    # Обрати внимание: ReviewResponse ожидает поля like_count и is_liked,
    # и наш сервис их уже заботливо проставил!
    reviews_json = json.dumps(
        [
            schemas.ReviewResponse.model_validate(r).model_dump(mode="json")
            for r in trending_reviews
        ],
        ensure_ascii=False,
    )

    # 3. Сохраняем в Redis на 1 час (3600 секунд)
    await redis.set(cache_key, reviews_json, ex=3600)

    # Отдаем ответ клиенту
    return Response(content=reviews_json, media_type="application/json")


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
