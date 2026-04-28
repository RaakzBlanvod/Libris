#!/bin/bash
set -e

# Применяем миграции базы данных
echo "Running database migrations..."
uv run alembic upgrade head

# Запускаем приложение
echo "Starting application..."
exec uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload