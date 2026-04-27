FROM python:3.12-slim

WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Установка uv
RUN pip install uv

# Копирование файлов зависимостей
COPY pyproject.toml uv.lock ./

# Установка зависимостей через uv (создаст .venv в /app/.venv)
RUN uv sync --frozen --no-dev

# Копирование исходного кода
COPY . .

# Даём права на исполнение стартового скрипта
RUN chmod +x start.sh

# Запуск: сначала миграции, потом приложение
CMD ["bash", "start.sh"] 