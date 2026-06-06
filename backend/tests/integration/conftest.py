import pytest
import redis.asyncio as redis
from httpx import AsyncClient, ASGITransport
from urllib.parse import urlparse, urlunparse
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from src.main import app
from src.core.database import get_db, Base
from src.core.redis import get_redis
from src.core.config import settings


def get_test_db_url(url: str, test_db_name: str = "libris_test") -> str:
    """Заменяет имя базы данных в URL на тестовое."""
    parsed = urlparse(url)
    return urlunparse(parsed._replace(path=f"/{test_db_name}"))


def get_test_redis_url(url: str, test_db: int = 1) -> str:
    """Заменяет номер базы данных в URL Redis на тестовый (например, 1)."""
    parsed = urlparse(url)
    return urlunparse(parsed._replace(path=f"/{test_db}"))


TEST_DATABASE_URL = get_test_db_url(settings.DATABASE_URL)
TEST_REDIS_URL = get_test_redis_url(settings.REDIS_URL)

engine_test = create_async_engine(TEST_DATABASE_URL, echo=False)
async_session_test = async_sessionmaker(
    engine_test, expire_on_commit=False, class_=AsyncSession
)


@pytest.fixture(scope="session", autouse=True)
async def prepare_database():
    """
    Создает все таблицы в тестовой БД перед началом тестов
    и удаляет их после завершения.
    """
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="session", autouse=True)
async def prepare_redis():
    """
    Очищает тестовую базу Redis перед тестами и после них.
    """
    redis_client = redis.from_url(TEST_REDIS_URL, decode_responses=True)
    await redis_client.flushdb()
    yield
    await redis_client.flushdb()
    await redis_client.aclose()


async def override_get_db():
    """Подмена зависимости get_db."""
    async with async_session_test() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def override_get_redis():
    """Подмена зависимости get_redis на тестовую базу."""
    redis_client = redis.from_url(TEST_REDIS_URL, decode_responses=True)
    try:
        yield redis_client
    finally:
        await redis_client.aclose()


# Применяем подмены
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_redis] = override_get_redis


@pytest.fixture(scope="function")
async def client():
    """
    Асинхронный клиент для тестирования FastAPI без запуска uvicorn.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
