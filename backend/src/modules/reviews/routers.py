from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import json
import redis.asyncio as redis

from src.core.database import get_db
from src.core.redis import get_redis
from src.modules.auth.deps import get_current_user, get_current_user_optional
from src.modules.users.models import User
from . import schemas
from .services import ReviewService

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get(
    "/trending",
    response_model=List[schemas.ReviewResponse],
    summary="Трендовые рецензии",
    description="Возвращает список самых залайканных рецензий за последние 7 дней. Сначала проверяет кэш Redis. Если пусто — идет в PostgreSQL.",
)
async def get_trending(
    redis: redis.Redis = Depends(get_redis),
    db: AsyncSession = Depends(get_db),
):
    cache_key = "dashboard:trending_reviews"

    cached_reviews = await redis.get(cache_key)

    if cached_reviews:
        return Response(content=cached_reviews, media_type="application/json")

    trending_reviews = await ReviewService.get_trending_reviews(db, limit=10)

    reviews_json = json.dumps(
        [
            schemas.ReviewResponse.model_validate(r).model_dump(mode="json")
            for r in trending_reviews
        ],
        ensure_ascii=False,
    )

    await redis.set(cache_key, reviews_json, ex=3600)

    return Response(content=reviews_json, media_type="application/json")


@router.get(
    "/my",
    response_model=List[schemas.MyReviewResponse],
    summary="Получить мои рецензии",
    description="Возвращает список всех рецензий, оставленных текущим пользователем.",
)
async def get_my_reviews(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ReviewService.get_my_reviews(db, current_user.id)


@router.get(
    "/my/likes",
    response_model=List[int],
    summary="Получить лайкнутые рецензии",
    description="Возвращает массив ID рецензий, которые лайкнул текущий пользователь. Удобно для покраски сердечек на клиенте поверх кэшированных трендов.",
)
async def get_my_liked_review_ids(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ReviewService.get_my_liked_review_ids(db, current_user.id)


@router.post(
    "/book/{book_id}",
    response_model=schemas.ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать рецензию",
    description="Создает новую рецензию для указанной книги от имени текущего пользователя.",
)
async def create_review(
    book_id: int,
    review_in: schemas.ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return await ReviewService.create_review(
            db, current_user.id, book_id, review_in
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/book/{book_id}",
    response_model=List[schemas.ReviewResponse],
    summary="Получить отзывы к книге",
    description="Возвращает список всех отзывов к указанной книге, отсортированных по дате создания.",
)
async def get_book_reviews(
    book_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    return await ReviewService.get_book_reviews(
        db, book_id, current_user.id if current_user else None
    )


@router.patch(
    "/{review_id}",
    response_model=schemas.ReviewResponse,
    summary="Обновить рецензию",
    description="Обновляет существующую рецензию текущего пользователя.",
)
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


@router.delete(
    "/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить рецензию",
    description="Удаляет существующую рецензию текущего пользователя.",
)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        await ReviewService.delete_review(db, review_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/{review_id}/like",
    response_model=schemas.LikeResponse,
    summary="Поставить лайк к рецензии",
    description="Позволяет текущему пользователю поставить лайк указанной рецензии.",
)
async def like_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return await ReviewService.toggle_like(db, current_user.id, review_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
