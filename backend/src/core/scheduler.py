import json
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from src.core.database import async_session_maker
from src.core.redis import get_redis
from src.modules.books.services import BookService
from src.modules.reviews.services import ReviewService
from src.modules.books.schemas import BookShortResponse
from src.modules.reviews.schemas import MyReviewResponse

logger = logging.getLogger(__name__)


scheduler = AsyncIOScheduler()


async def update_dashboard_cache_task():
    """
    Фоновая задача: собирает топ книг и отзывов за неделю из Postgres
    и обновляет кэш в Redis.

    Задача запускается каждые 55 минут и обновляет следующие кэши:
    - dashboard:trending_books - топ-10 самых популярных книг за неделю
    - dashboard:trending_reviews - топ-10 самых залайканных отзывов за неделю
    """
    logger.info("Updating dashboard cache")

    async with async_session_maker() as db:
        try:
            trending_books = await BookService.get_trending_books(db, limit=10)
            trending_reviews = await ReviewService.get_trending_reviews(db, limit=10)

            books_json = json.dumps(
                [
                    BookShortResponse.model_validate(b).model_dump(mode="json")
                    for b in trending_books
                ],
                ensure_ascii=False,
            )

            reviews_json = json.dumps(
                [
                    MyReviewResponse.model_validate(r).model_dump(mode="json")
                    for r in trending_reviews
                ],
                ensure_ascii=False,
            )

            redis_client = await get_redis()

            await redis_client.set("dashboard:trending_books", books_json, ex=3600)
            await redis_client.set("dashboard:trending_reviews", reviews_json, ex=3600)

            logger.info("Dashboard cache updated successfully")

        except Exception as e:
            logger.error(f"Failed to update dashboard cache: {e}", exc_info=True)


def init_scheduler():
    """
    Настройка расписания для задач.
    Обновление кэша раз в 55 минут
    """
    scheduler.add_job(
        update_dashboard_cache_task,
        trigger=IntervalTrigger(minutes=55),
        id="update_dashboard_cache",
        replace_existing=True,
    )
