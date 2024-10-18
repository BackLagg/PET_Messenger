# Указываем базовый образ с Node.js
FROM node:16-alpine

# Устанавливаем рабочую директорию в контейнере
WORKDIR /app

# Копируем package.json и package-lock.json в контейнер
COPY package*.json .

# Устанавливаем зависимости
RUN npm install

# Копируем все файлы проекта в контейнер
COPY .. .

# Сборка приложения для production
RUN npm run build

# Устанавливаем сервер для запуска React-приложения (например, serve)
RUN npm install -g serve

# Указываем порт
EXPOSE 3000

# Запускаем приложение на сервере serve
CMD ["serve", "-s", "build", "-l", "3000"]