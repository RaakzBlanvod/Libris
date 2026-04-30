from pydantic import BaseModel, ConfigDict
from typing import List, Optional


# Вспомогательные схемы

class AuthorResponse(BaseModel):
    """
    Схема для возврата данных об авторе.
    Используется как вложенный объект в ответах по книгам.
    """
    id: Optional[int] = None
    name: str

    model_config = ConfigDict(from_attributes=True)


class GenreResponse(BaseModel):
    """
    Схема для возврата данных о жанре.
    Используется для отображения категорий книги.
    """
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

# Основные схемы книг

class BookShortResponse(BaseModel):
    """
    Упрощенная схема книги для списков (Главная, поиск, каталог).
    Содержит только необходимую информацию для отрисовки карточки.
    """
    id: Optional[int] = None
    google_id: Optional[str] = None
    title: str
    authors: List[AuthorResponse]
    cover_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BookDetailResponse(BaseModel):
    """
    Полная схема книги для детальной страницы.
    """
    id: int
    title: str
    description: Optional[str] = None
    google_id: Optional[str] = None
    cover_url: Optional[str] = None
    page_count: Optional[int] = None
    isbn: Optional[str] = None
    authors: List[AuthorResponse]
    genres: List[GenreResponse]

    model_config = ConfigDict(from_attributes=True)


# Схемы для внешних данных

class GoogleBookMetadata(BaseModel):
    """
    Схема для первичной обработки данных напрямую из Google Books API.
    Помогает валидировать ответ от внешнего сервиса перед сохранением в нашу БД.
    """
    google_id: str
    title: str
    authors: List[str] = []
    categories: List[str] = []
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    page_count: Optional[int] = None
    isbn: Optional[str] = None