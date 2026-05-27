import redis.asyncio as redis
from src.core.config import settings

redis_client: redis.Redis | None = None


async def init_redis():
    """
    Инициализация пула соединений с Redis.
    """
    global redis_client
    redis_client = redis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        # Конвертация байтов в строки
        decode_responses=True,
        retry_on_timeout=True,
    )


async def get_redis() -> redis.Redis:
    """
    Dependency для получения клиента в роутерах.

    Returns:
        Инициализированный клиент Redis.

    Raises:
        RuntimeError: Если клиент Redis не был инициализирован.
    """
    if redis_client is None:
        raise RuntimeError("Redis client is not initialized. Call init_redis first.")
    return redis_client


async def close_redis():
    """
    Закрытие пула соединений.
    """
    global redis_client
    if redis_client:
        await redis_client.aclose()
