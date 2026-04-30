from enum import Enum
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class BookmarkStatus(str, Enum):
    """
    Допустимые статусы для закладок.
    Наследуемся от str, чтобы в JSON это уходило как обычная строка.
    """
    PLANNED = "Planned"
    READING = "Reading"
    FINISHED = "Finished"
    DROPPED = "Dropped"


class BookmarkBase(BaseModel):
    """
    Базовая схема для закладки.
    Содержит поля, общие для всех остальных схем.
    """
    status: BookmarkStatus = Field(
        default=BookmarkStatus.PLANNED, 
        description="Текущий статус книги в библиотеке пользователя"
    )


class BookmarkCreate(BookmarkBase):
    """
    Схема для POST-запроса (добавление в закладки).
    Пользователь передает только ID книги и, по желанию, статус (по умолчанию Planned).
    """
    book_id: int = Field(..., description="ID книги, которую нужно добавить в закладки")

# Не нужна пока, можно обходиться toggle_bookmark, но оставляю для возможного будущего использования.
# class BookmarkUpdate(BookmarkBase):
#     """
#     Схема для PATCH/PUT-запроса (изменение статуса).
#     Наследует поле status от BookmarkBase. 
#     book_id здесь не нужен, так как мы меняем статус уже существующей закладки.
#     """
#     pass


class BookmarkResponse(BookmarkBase):
    """
    Схема для ответа API (возврат данных из базы).
    """
    id: int = Field(..., description="Уникальный ID закладки")
    user_id: int = Field(..., description="ID владельца закладки")
    book_id: int = Field(..., description="ID сохраненной книги")
    created_at: datetime = Field(..., description="Дата и время добавления")
    updated_at: datetime = Field(..., description="Дата и время обновления")

    # Включаем совместимость с объектами SQLAlchemy
    model_config = ConfigDict(from_attributes=True)