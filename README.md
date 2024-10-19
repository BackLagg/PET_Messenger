# PET Messenger

## Оглавление / Table of Contents
1. [Описание проекта / Project Description](#описание-проекта--project-description)
2. [Основные функции / Features](#основные-функции--features)
3. [Используемые технологии / Technologies Used](#используемые-технологии--technologies-used)
4. [Установка / Installation](#установка--installation)
5. [Установка (Kubernetes) / Installation (Kubernetes)](#установка-(kubernetes)--installation-(kubernetes))
6. [Использование / Usage](#использование--usage)
7. [Вклад в проект / Contributing](#вклад-в-проект--contributing)

---

## Описание проекта / Project Description

### English:
PET Messenger is a web-based messenger application where users can register, log in, add friends, and chat in real-time. This project aims to showcase my skills in development using modern web technologies such as FastAPI, React, and WebSocket. The backend manages user authentication, chat functionality, and stores data in PostgreSQL, while the frontend offers a user-friendly interface.

### Русский:
PET Messenger — это веб-приложение для обмена сообщениями, в котором пользователи могут зарегистрироваться, войти в систему, добавлять друзей и общаться в реальном времени. Проект создан для демонстрации моих навыков в разработке с использованием современных технологий, таких как FastAPI, React и WebSocket. Бэкенд отвечает за аутентификацию пользователей, функциональность чатов и хранение данных в PostgreSQL, а фронтенд предоставляет удобный интерфейс.

[Оглавление / Table of Contents](#оглавление--table-of-Contents)

---

## Основные функции / Features

### English:
- User authentication (registration, login, logout)
- Real-time messaging and sending files using WebSocket
- Friend management (add, remove, friend requests)
- Profile management (update user information)
- Responsive UI using React

### Русский:
- Аутентификация пользователей (регистрация, вход, выход)
- Обмен сообщениями и файлами в реальном времени через WebSocket
- Управление друзьями (добавление, удаление, запросы в друзья)
- Управление профилем (обновление информации о пользователе)
- Адаптивный интерфейс на React
- 
[Оглавление / Table of Contents](#оглавление--table-of-Contents)

---

## Используемые технологии / Technologies Used

### English:
This project is built with the following technologies:
- **FastAPI**: Python-based web framework for building APIs.
- **React**: JavaScript library for building user interfaces.
- **PostgreSQL**: Relational database for storing user data and chat history.
- **SQLAlchemy**: ORM for handling database interactions in Python.
- **Redis**: Non-relational database used as a message broker and to store background task data.
- **Celery**: Distributed queue for handling background tasks.
- **Prometheus**: Monitoring system and time-series database for collecting metrics.
- **Kubernetes**: Container orchestration for deploying and scaling the application.
- **Docker**: Containerization platform used to deploy the application.
- **Docker Compose**: Tool for defining and running multi-container Docker applications.
- **WebSocket**: For real-time messaging.
- **JWT (JSON Web Tokens)**: For secure user authentication and authorization.
- **FastAPI-Users**: User management system for authentication and user-related features.

### Русский:
Проект создан с использованием следующих технологий:
- **FastAPI**: Веб-фреймворк на Python для создания API.
- **React**: Библиотека JavaScript для создания пользовательских интерфейсов.
- **PostgreSQL**: Реляционная база данных для хранения пользовательских данных и истории чатов.
- **SQLAlchemy**: ORM для работы с базами данных в Python.
- **Redis**: Нереляционная база данных, используемая как брокер сообщений и для хранения данных о фоновых операциях.
- **Celery**: Распределённая очередь для выполнения фоновых задач.
- **Prometheus**: Система мониторинга и база данных временных рядов для сбора метрик.
- **Kubernetes**: Оркестрация контейнеров для развертывания и масштабирования приложений.
- **Docker**: Платформа контейнеризации для развертывания приложения.
- **Docker Compose**: Инструмент для определения и управления многоконтейнерными Docker приложениями.
- **WebSocket**: Для обмена сообщениями в реальном времени.
- **JWT (JSON Web Tokens)**: Для безопасной аутентификации и авторизации пользователей.
- **FastAPI-Users**: Система управления пользователями для аутентификации и работы с пользовательскими функциями.

[Оглавление / Table of Contents](#оглавление--table-of-Contents)

---


## Установка / Installation

### English:
1. Clone the repository:
   ```bash
   git clone https://github.com/BackLagg/PET_Messenger.git
2. Navigate to the project directory:
   ```bash
   cd PET_app
3. Create and configure your .env file based on .env.example.
4. Build and start the application using Docker:
   ```bash
   docker-compose up --build
5. Access the application at http://localhost:3000.

### Русский:
1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/BackLagg/PET_Messenger.git
2. Перейдите в директорию проекта:
   ```bash
   cd PET_Messenger
3. Создайте и настройте файл .env на основе примера .env.example.
4. Соберите и запустите приложение с помощью Docker:
   ```bash
   docker-compose up --build
5. Откройте приложение по адресу http://localhost:3000.

[Оглавление / Table of Contents](#оглавление--table-of-Contents)

---

## Установка (Kubernetes) / Installation (Kubernetes)

### English:
To deploy the application using Kubernetes, follow these steps:

1. **Build Docker images:**
   Make sure to first build the Docker images using the `docker-compose` command:
   ```bash
   docker-compose build
2. Create Kubernetes manifests: Create YAML files for your Kubernetes deployment, services, and other necessary resources like ConfigMap(based on ConfigMap_example) and Secret(based on Secret_example).
3. Apply the Kubernetes manifests: Use kubectl to apply the manifests:
   ```bash
   cd .\Kuber_settings\  
   kubectl apply -f .

### Русский:
Для развертывания приложения с использованием Kubernetes выполните следующие шаги:

1. Создайте Docker-образы: Сначала соберите Docker-образы с помощью команды docker-compose:
   ```bash
   docker-compose build
2. Создайте манифесты Kubernetes: Создайте YAML-файлы для деплоя, сервисов и других необходимых ресурсов, таких как ConfigMap(основанный на ConfigMap_example) и Secret(основанный на Secret_example).
3. Примените манифесты Kubernetes: Используйте kubectl, чтобы применить манифесты:
   ```bash
   kubectl apply -f .
   
[Оглавление / Table of Contents](#оглавление--table-of-Contents)

---

## Использование / Usage
### English:
1. Register a new user or log in with an existing account.
2. Start chatting with friends by adding them to your list.
3. Update your profile information or manage your friend list.
### Русский:
1. Зарегистрируйте нового пользователя или войдите в существующую учетную запись.
2. Начните общение с друзьями, добавляя их в свой список.
3. Обновите информацию в профиле или управляйте списком друзей.

## Вклад в проект / Contributing
### English:
Feel free to contribute to the project by submitting pull requests or opening issues. For major changes, please discuss them first via an issue.

### Русский:
Не стесняйтесь вносить свой вклад в проект, отправляя pull-запросы или создавая issue. Для значительных изменений сначала обсудите их в issue.

[Оглавление / Table of Contents](#оглавление--table-of-Contents)

---