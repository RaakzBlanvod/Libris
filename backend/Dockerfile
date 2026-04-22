FROM python:3.12-slim

WORKDIR /app

# Установка системных зависимостей (curl нужен для установки uv)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Установка uv
ADD https://astral.sh/uv/install.sh /uv-installer.sh
RUN sh /uv-installer.sh && rm /uv-installer.sh
ENV PATH="/root/.local/bin:$PATH"

# Копирование файлов зависимостей
COPY pyproject.toml uv.lock* ./

# Установка зависимостей через uv (если есть pyproject.toml)
RUN if [ -f pyproject.toml ]; then uv pip install --system -r pyproject.toml; fi

# Копирование исходного кода
COPY . .

# Запуск
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]