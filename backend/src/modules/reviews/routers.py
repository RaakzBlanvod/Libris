from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.core.database import get_db
from src.modules.auth.deps import get_current_user
from src.modules.users.models import User
from . import schemas
from .services import ReviewService

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.post("/", response_model=schemas.ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_in: schemas.ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Оставить новую рецензию на книгу.
    """
    try:
        return await ReviewService.create_review(db, current_user.id, review_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/book/{book_id}", response_model=List[schemas.ReviewResponse])
async def get_book_reviews(
    book_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Получить все отзывы к конкретной книге.
    """
    return await ReviewService.get_book_reviews(db, book_id)


@router.get("/my", response_model=List[schemas.MyReviewResponse])
async def get_my_reviews(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
):
    try:
        return await ReviewService.update_review(db, review_id, current_user.id, review_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        await ReviewService.delete_review(db, review_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
