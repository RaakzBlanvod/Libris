Frontend (React + Vite)
 **Стек:** React 19, Vite, React Router, Tailwind CSS v4, Axios, lucide-react.

## Требования

- **Node.js 20.19+** (рекомендуется 22 LTS) и npm — для локальной разработки.
- **Запущенный backend** на `http://localhost:8000` (FastAPI + PostgreSQL + Redis).
- Либо **Docker** — если хотите поднять весь стек одной командой (Node на машине не нужен).


## Вариант A. Запуск всего проекта через Docker (проще всего «посмотреть»)

Поднимает frontend + backend + PostgreSQL + Redis сразу. Все команды — **из корня репозитория**, не из `frontend/`.

```bash
# 1. Создать .env из шаблонов (backend/.env и frontend/.env)
./setup_env.sh

# 2. Сгенерировать секретный ключ для JWT и вставить его в backend/.env -> SECRET_KEY=
openssl rand -hex 32

# 3. Собрать и запустить все контейнеры
docker compose up -d --build

# 4. Применить миграции БД (если не накатились автоматически)
docker compose exec backend alembic upgrade head
```

После запуска:
- **Frontend:** http://localhost
- **Backend API (Swagger):** http://localhost:8000/docs

Подробности про Docker, миграции и полезные команды — в [корневом README](../README.md).

---

## Вариант B. Локальная разработка фронтенда (Vite + hot reload)

Рекомендуется, когда вы пишете именно фронтенд: мгновенная перезагрузка при изменениях.

**Шаг 1. Поднять backend** (нужен на `:8000`). Проще всего — только инфраструктуру через Docker:

```bash
# из корня репозитория
docker compose up -d postgres redis backend
docker compose exec backend alembic upgrade head
```

**Шаг 2. Запустить фронтенд локально:**

```bash
cd frontend
npm install
npm run dev
```

Откройте **http://localhost:5173**

> Dev-сервер Vite сам проксирует `/api` и `/static` на `http://localhost:8000`
> (см. `vite.config.js`), поэтому отдельный адрес API настраивать не нужно —
> достаточно, чтобы backend был запущен.

---

## npm-скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | Dev-сервер с hot-reload на `:5173` |
| `npm run build` | Продакшн-сборка в `dist/` |
| `npm run preview` | Локальный предпросмотр собранного `dist/` |
| `npm run lint` | Проверка ESLint |

## Переменные окружения

Файл `frontend/.env` создаётся скриптом `../setup_env.sh` из `.env.example`.
В режиме разработки запросы к API идут через прокси Vite, поэтому обычно
менять в нём ничего не нужно.

## Структура `src/`
```
src/
├── api/client.js            # Axios-инстанс: токен, авто-refresh при 401
├── context/
│   ├── AuthContext.jsx      # авторизация (login/logout/refresh)
│   ├── ToastContext.jsx     # всплывающие уведомления
│   └── ConfirmContext.jsx   # модалки подтверждения
├── components/
│   ├── Header/              # шапка с навигацией
│   ├── Footer/
│   ├── Avatar/              # аватар + инициалы
│   └── ReviewCard/          # карточка рецензии (лайк, разбор по критериям)
├── pages/
│   ├── Home/                # главная: поиск, тренды, подборки по жанрам
│   ├── Auth/                # вход / регистрация
│   ├── BookDetail/          # страница книги, рецензии, похожие книги
│   ├── Bookmarks/           # библиотека с поиском и фильтром
│   ├── Reviews/             # лучшие рецензии + создание рецензии
│   └── Profile/             # профиль, статистика, вкладки, модалки
├── App.jsx                  # роуты + провайдеры
└── main.jsx                 # точка входа
```

##  Сборка для продакшна

`frontend/Dockerfile` — multi-stage сборка: собирает приложение и отдаёт статику
через nginx на порту `80` (используется сервисом `frontend` в `docker-compose.yml`).
`frontend/nginx.conf` проксирует `/api` и `/static` на сервис `backend`, а все
клиентские маршруты отдаёт через `index.html` (SPA-fallback) — поэтому в Docker
фронтенд на `:80` полноценно работает с API.

##  Траблшутинг

- **Порт 5173 занят** — Vite предложит другой порт, либо освободите 5173.
- **Запросы к API падают (500/404, «Network Error»)** — убедитесь, что backend запущен
  на `:8000` и накачены миграции (`alembic upgrade head`).
- **Docker-режим (`:80`):** проксирование `/api` и `/static` на backend настроено
  в `frontend/nginx.conf`. Если запросы всё же не проходят — проверьте, что сервис
  `backend` поднят и здоров (`docker compose ps`).
- **Аватары не грузятся** — проверьте, что проксируется `/static` (есть в `vite.config.js`).
