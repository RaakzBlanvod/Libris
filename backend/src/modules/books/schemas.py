from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional


# --- Вспомогательные схемы ---


class AuthorResponse(BaseModel):
    """
    Схема для возврата данных об авторе.
    Используется как вложенный объект в ответах по книгам.
    """

    id: Optional[int] = Field(
        default=None, description="Уникальный идентификатор автора"
    )
    name: str = Field(..., description="Имя автора")

    model_config = ConfigDict(from_attributes=True)


class GenreResponse(BaseModel):
    """
    Схема для возврата данных о жанре.
    Используется для отображения категорий книги.
    """

    id: int = Field(..., description="Уникальный идентификатор жанра")
    name: str = Field(..., description="Название жанра")

    model_config = ConfigDict(from_attributes=True)


# --- Основные схемы книг ---


class BookShortResponse(BaseModel):
    """
    Упрощенная схема книги для списков (Главная, поиск, каталог).
    Содержит только необходимую информацию для отрисовки карточки.
    """

    id: Optional[int] = Field(
        default=None, description="Внутренний ID книги (если есть в базе)"
    )
    google_id: Optional[str] = Field(
        default=None, description="ID книги в Google Books"
    )
    title: str = Field(..., description="Название книги")
    authors: List[AuthorResponse] = Field(..., description="Список авторов книги")
    cover_url: Optional[str] = Field(default=None, description="URL обложки книги")

    model_config = ConfigDict(from_attributes=True)


class BookDetailResponse(BaseModel):
    """
    Полная схема книги для детальной страницы.
    """

    id: int = Field(..., description="Внутренний ID книги")
    title: str = Field(..., description="Название книги")
    description: Optional[str] = Field(
        default=None, description="Описание или аннотация книги"
    )
    google_id: Optional[str] = Field(
        default=None, description="ID книги в Google Books"
    )
    cover_url: Optional[str] = Field(default=None, description="URL обложки книги")
    page_count: Optional[int] = Field(default=None, description="Количество страниц")
    isbn: Optional[str] = Field(
        default=None, description="Международный стандартный книжный номер (ISBN)"
    )
    authors: List[AuthorResponse] = Field(..., description="Список авторов книги")
    genres: List[GenreResponse] = Field(..., description="Список жанров книги")
    average_rating: float = Field(default=0.0, description="Средняя оценка книги")
    reviews_count: int = Field(default=0, description="Общее количество рецензий")

    model_config = ConfigDict(from_attributes=True)


# --- Схемы для внешних данных ---


class GoogleBookMetadata(BaseModel):
    """
    Схема для первичной обработки данных напрямую из Google Books API.
    Помогает валидировать ответ от внешнего сервиса перед сохранением в БД.
    """

    google_id: str = Field(..., description="ID книги в Google Books API")
    title: str = Field(..., description="Название книги")
    authors: List[str] = Field(default_factory=list, description="Массив имен авторов")
    categories: List[str] = Field(
        default_factory=list, description="Массив жанров/категорий"
    )
    description: Optional[str] = Field(default=None, description="Описание книги")
    thumbnail_url: Optional[str] = Field(
        default=None, description="URL миниатюры обложки"
    )
    page_count: Optional[int] = Field(default=None, description="Количество страниц")
    isbn: Optional[str] = Field(default=None, description="ISBN книги")
