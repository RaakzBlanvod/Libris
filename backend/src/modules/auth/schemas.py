from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    """
    Схема для регистрации нового пользователя.
    """

    email: EmailStr = Field(..., description="Электронная почта пользователя")
    username: str = Field(
        ..., min_length=3, max_length=50, description="Имя пользователя (никнейм)"
    )
    password: str = Field(
        ..., min_length=8, max_length=72, description="Пароль пользователя"
    )


class Token(BaseModel):
    """
    Схема для пары токенов (access и refresh).
    """

    access_token: str = Field(..., description="JWT Access токен")
    refresh_token: str = Field(..., description="JWT Refresh токен")
    token_type: str = Field(default="bearer", description="Тип токена")


class TokenRefresh(BaseModel):
    """
    Схема для обновления токена.
    """

    refresh_token: str = Field(..., description="Действующий Refresh токен")
