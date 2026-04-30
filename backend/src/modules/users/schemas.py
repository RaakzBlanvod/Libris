from pydantic import BaseModel, EmailStr, ConfigDict, Field


# Базовая схема с общими полями
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


# Схема для регистрации
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=72)


# Схема для ответа без пароля
class UserResponse(UserBase):
    id: int
    is_active: bool

    # Для работы pydantic с orm
    model_config = ConfigDict(from_attributes=True)


# Схема для логина, получение токена
class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"