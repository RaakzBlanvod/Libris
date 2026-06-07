from typing import List, Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator


class UserBase(BaseModel):
    """
    Базовая схема пользователя с общими полями.
    """

    email: EmailStr = Field(..., description="Электронная почта пользователя")
    username: str = Field(
        ..., min_length=3, max_length=50, description="Уникальное имя пользователя"
    )


class UserCreate(UserBase):
    """
    Схема для регистрации нового пользователя.
    """

    password: str = Field(
        ..., min_length=8, max_length=72, description="Строгий пароль пользователя"
    )


class UserShortResponse(BaseModel):
    """
    Краткая информация о пользователе (для вложенных ответов, например, в рецензиях).
    """

    id: int = Field(..., description="Уникальный идентификатор пользователя")
    username: str = Field(..., description="Имя пользователя")
    avatar: str | None = Field(default=None, description="URL аватара пользователя")

    @field_validator("avatar", mode="before")
    @classmethod
    def set_default_avatar(cls, v: Optional[str]) -> str:
        return v if v else "/static/avatars/default.png"

    model_config = ConfigDict(from_attributes=True)


class UserRead(BaseModel):
    """
    Схема для просмотра публичного профиля пользователя.
    Не содержит email и других приватных данных.
    """

    id: int = Field(..., description="Уникальный идентификатор пользователя")
    username: str = Field(..., description="Имя пользователя")
    bio: str | None = Field(default=None, description="Краткая информация о себе")
    avatar: str | None = Field(default=None, description="URL аватара пользователя")
    favorite_genres: List[str] | None = Field(
        default=None, description="Любимые жанры пользователя"
    )
    reviews_count: int = Field(default=0, description="Количество написанных рецензий")
    read_books_count: int = Field(default=0, description="Количество прочитанных книг")

    @field_validator("avatar", mode="before")
    @classmethod
    def set_default_avatar(cls, v: Optional[str]) -> str:
        return v if v else "/static/avatars/default.png"

    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    """
    Схема для ответа авторизованному пользователю с его личными данными.
    Не содержит пароля.
    """

    id: int = Field(..., description="Уникальный идентификатор пользователя")
    is_active: bool = Field(..., description="Флаг активности аккаунта")
    avatar: str | None = Field(default=None, description="URL аватара пользователя")

    @field_validator("avatar", mode="before")
    @classmethod
    def set_default_avatar(cls, v: Optional[str]) -> str:
        return v if v else "/static/avatars/default.png"

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    """
    Схема для обновления данных профиля пользователя (PATCH /me).
    """

    username: str | None = Field(
        default=None, min_length=3, max_length=50, description="Новое имя пользователя"
    )
    bio: str | None = Field(
        default=None, max_length=1024, description="Новое описание профиля"
    )
    favorite_genres: List[str] | None = Field(
        default=None, description="Обновленный список любимых жанров"
    )
