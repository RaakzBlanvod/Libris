from enum import Enum
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from src.modules.books.schemas import BookShortResponse


class BookmarkStatus(str, Enum):
    """
    Enum статусов для закладок пользователя.
    Наследуется от str для корректной сериализации в JSON.
    """

    PLANNED = "Planned"
    READING = "Reading"
    FINISHED = "Finished"
    DROPPED = "Dropped"


class BookmarkBase(BaseModel):
    """
    Базовая схема закладки.
    """

    status: BookmarkStatus = Field(
        default=BookmarkStatus.PLANNED,
        description="Текущий статус книги в библиотеке пользователя",
    )


class BookmarkCreate(BookmarkBase):
    """
    Схема для добавления книги в закладки.
    """

    book_id: int = Field(
        ..., description="Внутренний ID книги для добавления в закладки"
    )


class BookmarkResponse(BookmarkBase):
    """
    Схема для возврата данных о закладке из API.
    """

    id: int = Field(..., description="Уникальный ID закладки")
    user_id: int = Field(..., description="ID владельца закладки")
    book_id: int = Field(..., description="ID сохраненной книги")
    created_at: datetime = Field(..., description="Дата и время добавления в закладки")
    updated_at: datetime = Field(
        ..., description="Дата и время последнего обновления закладки"
    )

    model_config = ConfigDict(from_attributes=True)


class BookmarkWithBookResponse(BookmarkResponse):
    """
    Схема для списка закладок пользователя (включает данные о книге).
    """

    book: BookShortResponse = Field(..., description="Краткая информация о книге")
