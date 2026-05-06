from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.modules.auth.routers import router as auth_router
from src.modules.users.routers import router as users_router
from src.modules.books.routers import router as books_router
from src.modules.reviews.routers import router as reviews_router
from src.modules.bookmarks.routers import router as bookmarks_router

import os
os.makedirs("src/static/avatars", exist_ok=True)

app = FastAPI(title="Libris API")
app.mount("/static", StaticFiles(directory="src/static"), name="static")

# Настройка CORS, чтобы фронтенд мог достучаться до бэкенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",  # Для фронтенда в Докере (на 80 порту)
        "http://localhost:5173",  # Для фронтенда при локальной разработке (Vite)
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все методы (GET, POST, PUT, DELETE)
    allow_headers=["*"],  # Разрешаем любые заголовки
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"message": "Welcome to Libris API"}


# Сюда добавлять роутеры:
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(books_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")
app.include_router(bookmarks_router, prefix="/api/v1")


# Блок для запуска через `python src/main.py`
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
