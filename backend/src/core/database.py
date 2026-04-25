from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from src.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=True)

# Создание асинхронной сессии
async_session_maker = async_sessionmaker(
    engine, expire_on_commit=False, autoflush=False
)


# Базовый класс для всех моделей
class Base(DeclarativeBase):
    pass


# Функция для получения сессии базы данных
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
