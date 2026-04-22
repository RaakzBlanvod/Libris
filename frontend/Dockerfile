# Этап 1: Сборка
FROM node:alpine AS builder

WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Используем npm install вместо npm ci (работает и без lock-файла)
RUN npm install

# Копируем остальные файлы
COPY . .

# Сборка
RUN npm run build

# Этап 2: Nginx
FROM nginx:alpine

# Копируем собранные файлы
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]