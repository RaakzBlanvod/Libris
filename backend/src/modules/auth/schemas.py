from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    """
    Схема для регистрации нового пользователя.
    """
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=72)

class Token(BaseModel):
    """
    Схема для пары токенов.
    """
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenRefresh(BaseModel):
    """
    Схема для обновления токена.
    """
    refresh_token: str
