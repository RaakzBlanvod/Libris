import os
import asyncio
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.core.redis import init_redis, close_redis
from src.core.scheduler import init_scheduler, scheduler, update_dashboard_cache_task
from src.modules.auth.routers import router as auth_router
from src.modules.users.routers import router as users_router
from src.modules.books.routers import router as books_router
from src.modules.reviews.routers import router as reviews_router
from src.modules.bookmarks.routers import router as bookmarks_router

os.makedirs("src/static/avatars", exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    init_scheduler()
    scheduler.start()
    asyncio.create_task(update_dashboard_cache_task())

    yield

    await close_redis()
    scheduler.shutdown()


app = FastAPI(title="Libris API", lifespan=lifespan)

app.mount("/static", StaticFiles(directory="src/static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://libris-five.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
def health():
    return {"status": "ok"}


@app.get("/", tags=["System"])
async def root():
    return {"message": "Welcome to Libris API"}


@app.post(
    "/trigger-scheduler",
    summary="Ручной запуск планировщика",
    description="Вызывает функцию обновления кэша прямо сейчас.",
    tags=["System"],
)
async def trigger_scheduler():
    """
    Ручной запуск планировщика для обновления кэша.

    Эта эндпоинт позволяет запустить расчет топов книг и отзывов вне расписания.
    Кэш обновляется с тем же интервалом, что и в фоновой задаче (каждые 55 минут).
    """
    try:
        await update_dashboard_cache_task()
        return {"status": "success", "message": "Расчет топов запущен и кэш обновлен!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# Сюда добавлять роутеры:
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(books_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")
app.include_router(bookmarks_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
