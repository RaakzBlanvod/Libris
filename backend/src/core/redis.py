import redis.asyncio as redis
from src.core.config import settings

# Глобальная переменная для клиента
redis_client: redis.Redis | None = None


async def init_redis():
    """
    Инициализация пула соединений с Redis.
    Вызывается один раз при старте приложения.
    """
    global redis_client
    redis_client = redis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
        retry_on_timeout=True,
    )


async def get_redis() -> redis.Redis:
    """
    Зависимость (Dependency) для получения клиента в роутерах.
    """
    if redis_client is None:
        raise RuntimeError("Redis client is not initialized. Call init_redis first.")
    return redis_client


async def close_redis():
    """
    Закрытие пула соединений.
    Вызывается при остановке приложения.
    """
    global redis_client
    if redis_client:
        await redis_client.aclose()
