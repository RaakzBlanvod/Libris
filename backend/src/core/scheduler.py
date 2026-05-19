import json
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from src.core.database import async_session_maker
from src.core.redis import get_redis
from src.modules.books.services import BookService
from src.modules.reviews.services import ReviewService
from src.modules.books.schemas import BookShortResponse
from src.modules.reviews.schemas import ReviewResponse

logger = logging.getLogger(__name__)

# Инициализируем асинхронный планировщик
scheduler = AsyncIOScheduler()


async def update_dashboard_cache_task():
    """
    Фоновая задача: собирает топ книг и отзывов за неделю из Postgres
    и обновляет кэш в Redis.
    """
    logger.info("Старт фоновой задачи: обновление кэша главной страницы...")
    
    # 1. Так как задача бежит в фоне, у нас нет Depends(get_db). 
    # Мы создаем сессию Postgres вручную из нашей фабрики сессий
    async with async_session_maker() as db:
        try:
            # Получаем свежие данные из базы
            trending_books = await BookService.get_trending_books(db, limit=10)
            trending_reviews = await ReviewService.get_trending_reviews(db, limit=10)
            
            # 2. Сериализация в JSON через Pydantic схемы
            # Нам нужно превратить объекты SQLAlchemy в JSON-строки
            books_json = json.dumps([
                BookShortResponse.model_validate(b).model_dump(mode="json") 
                for b in trending_books
            ], ensure_ascii=False)
            
            reviews_json = json.dumps([
                ReviewResponse.model_validate(r).model_dump(mode="json") 
                for r in trending_reviews
            ], ensure_ascii=False)
            
            # 3. Сохраняем в Redis с TTL 1 час (3600 секунд)
            redis_client = await get_redis()
            
            await redis_client.set("dashboard:trending_books", books_json, ex=3600)
            await redis_client.set("dashboard:trending_reviews", reviews_json, ex=3600)
            
            logger.info("Кэш главной страницы успешно обновлен в Redis!")
            
        except Exception as e:
            logger.error(f"Ошибка при обновлении кэша в планировщике: {e}", exc_info=True)


def init_scheduler():
    """
    Настройка расписания для задач.
    """
    # Добавляем задачу: запускать каждые 55 минут
    scheduler.add_job(
        update_dashboard_cache_task,
        trigger=IntervalTrigger(minutes=55),
        id="update_dashboard_cache",
        replace_existing=True,
    )