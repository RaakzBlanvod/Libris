from typing import List, Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator


class UserBase(BaseModel):
    """
    Базовая схема пользователя с общими полями.
    """

    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    """
    Схема для регистрации нового пользователя.
    Добавляет поле пароля к базовой схеме.
    """

    password: str = Field(..., min_length=8, max_length=72)


class UserShortResponse(BaseModel):
    """
    Краткая информация о пользователе (для вложенных ответов, например, в рецензиях).
    """

    id: int
    username: str
    avatar: str | None = None

    @field_validator("avatar", mode="before")
    @classmethod
    def set_default_avatar(cls, v: Optional[str]) -> str:
        return v if v else "/static/avatars/default.png"

    model_config = ConfigDict(from_attributes=True)


class UserRead(BaseModel):
    """
    Схема для просмотра чужого профиля и своего.
    Не содержит email.
    """

    id: int
    username: str
    bio: str | None = None
    avatar: str | None = None
    favorite_genres: List[str] | None = None
    reviews_count: int = 0
    read_books_count: int = 0

    @field_validator("avatar", mode="before")
    @classmethod
    def set_default_avatar(cls, v: Optional[str]) -> str:
        return v if v else "/static/avatars/default.png"

    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    """
    Схема для ответа пользователю с его данными.
    Не содержит пароля.
    """

    id: int
    is_active: bool
    avatar: str | None = None

    @field_validator("avatar", mode="before")
    @classmethod
    def set_default_avatar(cls, v: Optional[str]) -> str:
        return v if v else "/static/avatars/default.png"

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    """
    Схема для обновления данных профиля пользователя (PATCH /me).
    """

    username: str | None = Field(None, min_length=3, max_length=50)
    bio: str | None = Field(None, max_length=1024)
    favorite_genres: List[str] | None = None
