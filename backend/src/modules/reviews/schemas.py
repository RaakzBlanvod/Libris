from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ReviewBase(BaseModel):
    """
    Базовая схема для рецензий с общими полями.
    """

    # Оценки (обязательно 1-5)
    plot_rating: int = Field(..., ge=1, le=5, description="Оценка сюжета")
    characters_rating: int = Field(..., ge=1, le=5, description="Оценка персонажей")
    style_rating: int = Field(..., ge=1, le=5, description="Оценка стиля и слога")
    pacing_rating: int = Field(
        ..., ge=1, le=5, description="Оценка темпа повествования"
    )
    world_rating: int = Field(..., ge=1, le=5, description="Оценка мироустройства")

    # Текстовые обоснования (обязательные)
    plot_text: str = Field(..., min_length=10, description="Обоснование оценки сюжета")
    characters_text: str = Field(
        ..., min_length=10, description="Обоснование оценки персонажей"
    )
    style_text: str = Field(..., min_length=10, description="Обоснование оценки стиля")
    pacing_text: str = Field(..., min_length=10, description="Обоснование оценки темпа")
    world_text: str = Field(
        ..., min_length=10, description="Обоснование оценки мироустройства"
    )

    general_text: str = Field(..., min_length=20, description="Общий вывод по книге")


class ReviewCreate(ReviewBase):
    """
    Схема для создания новой рецензии.
    """

    book_id: int = Field(..., description="Внутренний ID книги в нашей БД")


class ReviewUpdate(BaseModel):
    """
    Схема для частичного обновления рецензии. Все поля опциональны.
    """

    plot_rating: Optional[int] = Field(None, ge=1, le=5)
    characters_rating: Optional[int] = Field(None, ge=1, le=5)
    style_rating: Optional[int] = Field(None, ge=1, le=5)
    pacing_rating: Optional[int] = Field(None, ge=1, le=5)
    world_rating: Optional[int] = Field(None, ge=1, le=5)

    plot_text: Optional[str] = Field(None, min_length=10)
    characters_text: Optional[str] = Field(None, min_length=10)
    style_text: Optional[str] = Field(None, min_length=10)
    pacing_text: Optional[str] = Field(None, min_length=10)
    world_text: Optional[str] = Field(None, min_length=10)

    general_text: Optional[str] = Field(None, min_length=20)


class ReviewResponse(ReviewBase):
    """
    Схема для отображения рецензии в списках (на странице книги).
    """

    id: int
    user_id: int
    username: str  # Надо поменять на ссылку на пользователя (поменять схему User в users)
    overall_rating: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MyReviewResponse(ReviewResponse):
    """
    Схема для страницы 'Мои рецензии'. Добавляет название книги.
    """

    book_title: str
    # Здесь можно добавить book_id, если фронту нужно делать ссылку на книгу
    book_id: int
