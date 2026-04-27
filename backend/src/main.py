from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Libris API")

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

# Сюда добавлять роутеры:


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"message": "Welcome to Libris API"}


# Блок для запуска через `python src/main.py`
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
