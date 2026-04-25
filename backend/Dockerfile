FROM python:3.12-slim

WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Установка uv через pip (надёжнее, чем ADD)
RUN pip install uv

# Копирование файлов зависимостей
COPY pyproject.toml uv.lock* ./

# Установка зависимостей через uv
RUN if [ -f pyproject.toml ]; then uv pip install --system -r pyproject.toml; fi

# Копирование исходного кода
COPY . .

# Запуск
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]