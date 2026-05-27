from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from src.modules.users.schemas import UserShortResponse


class ReviewBase(BaseModel):
    """
    Базовая схема для рецензий с общими полями (оценки и тексты).
    """

    plot_rating: int = Field(..., ge=1, le=10, description="Оценка сюжета (от 1 до 10)")
    characters_rating: int = Field(
        ..., ge=1, le=10, description="Оценка персонажей (от 1 до 10)"
    )
    style_rating: int = Field(
        ..., ge=1, le=10, description="Оценка стиля и слога (от 1 до 10)"
    )
    pacing_rating: int = Field(
        ..., ge=1, le=10, description="Оценка темпа повествования (от 1 до 10)"
    )
    world_rating: int = Field(
        ..., ge=1, le=10, description="Оценка мироустройства (от 1 до 10)"
    )

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
    Наследует все обязательные поля из базовой схемы.
    """

    pass


class ReviewUpdate(BaseModel):
    """
    Схема для частичного обновления рецензии. Все поля опциональны.
    """

    plot_rating: Optional[int] = Field(
        default=None, ge=1, le=10, description="Новая оценка сюжета"
    )
    characters_rating: Optional[int] = Field(
        default=None, ge=1, le=10, description="Новая оценка персонажей"
    )
    style_rating: Optional[int] = Field(
        default=None, ge=1, le=10, description="Новая оценка стиля"
    )
    pacing_rating: Optional[int] = Field(
        default=None, ge=1, le=10, description="Новая оценка темпа"
    )
    world_rating: Optional[int] = Field(
        default=None, ge=1, le=10, description="Новая оценка мироустройства"
    )

    plot_text: Optional[str] = Field(
        default=None, min_length=10, description="Новое обоснование сюжета"
    )
    characters_text: Optional[str] = Field(
        default=None, min_length=10, description="Новое обоснование персонажей"
    )
    style_text: Optional[str] = Field(
        default=None, min_length=10, description="Новое обоснование стиля"
    )
    pacing_text: Optional[str] = Field(
        default=None, min_length=10, description="Новое обоснование темпа"
    )
    world_text: Optional[str] = Field(
        default=None, min_length=10, description="Новое обоснование мироустройства"
    )

    general_text: Optional[str] = Field(
        default=None, min_length=20, description="Новый общий вывод"
    )


class ReviewResponse(ReviewBase):
    """
    Схема для отображения полной рецензии в списках и на странице книги.
    """

    id: int = Field(..., description="Уникальный идентификатор рецензии")
    user: UserShortResponse = Field(..., description="Данные автора рецензии")
    overall_rating: float = Field(..., description="Средняя оценка по всем критериям")
    like_count: int = Field(default=0, description="Количество лайков")
    is_liked: bool = Field(..., description="Поставил ли текущий пользователь лайк")
    created_at: datetime = Field(..., description="Дата создания рецензии")
    updated_at: datetime = Field(..., description="Дата последнего обновления")

    model_config = ConfigDict(from_attributes=True)


class BookShortTitleResponse(BaseModel):
    """
    Краткая информация о книге для вложенных схем.
    """

    id: int = Field(..., description="Внутренний ID книги")
    title: str = Field(..., description="Название книги")

    model_config = ConfigDict(from_attributes=True)


class MyReviewResponse(ReviewResponse):
    """
    Схема для страницы 'Мои рецензии'.
    Включает информацию не только о самой рецензии, но и о книге.
    """

    book: BookShortTitleResponse = Field(
        ..., description="Данные о книге, на которую написана рецензия"
    )


class LikeResponse(BaseModel):
    """
    Схема для ответа при переключении лайка.
    """

    is_liked: bool = Field(
        ..., description="Текущее состояние лайка (True - поставлен, False - убран)"
    )
