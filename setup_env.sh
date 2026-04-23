#!/bin/bash

echo "🔧 Настройка окружения Libris..."
echo ""

# Создание backend/.env
if [ ! -f backend/.env ]; then
    if [ -f backend/.env.example ]; then
        cp backend/.env.example backend/.env
        echo "✅ Создан backend/.env из шаблона"
    else
        echo "❌ backend/.env.example не найден!"
    fi
else
    echo "⏭️  backend/.env уже существует, пропускаем"
fi

# Создание frontend/.env
if [ ! -f frontend/.env ]; then
    if [ -f frontend/.env.example ]; then
        cp frontend/.env.example frontend/.env
        echo "✅ Создан frontend/.env из шаблона"
    else
        echo "❌ frontend/.env.example не найден!"
    fi
else
    echo "⏭️  frontend/.env уже существует, пропускаем"
fi

# Генерация SECRET_KEY если он дефолтный
if grep -q "SECRET_KEY=your-secret-key-here-change-in-production" backend/.env 2>/dev/null; then
    NEW_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-me-in-production-$(date +%s)")
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/SECRET_KEY=.*/SECRET_KEY=$NEW_SECRET/" backend/.env
    else
        sed -i "s/SECRET_KEY=.*/SECRET_KEY=$NEW_SECRET/" backend/.env
    fi
    echo "🔐 Сгенерирован новый SECRET_KEY для backend/.env"
fi

echo ""
echo "✨ Готово! Проверь файлы:"
echo "   - backend/.env (SECRET_KEY уже сгенерирован)"
echo "   - frontend/.env (VITE_API_URL)"
echo ""
echo "🚀 Теперь запускай: docker compose up -d --build"