import asyncio
from datetime import datetime, timedelta

import jwt
from celery import Celery, shared_task
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from asgiref.sync import async_to_sync
from sqlalchemy import select, delete
from celery.schedules import crontab

from src.auth.models import User, UserInfo
from src.database import get_async_session
from src.friends.models import Friends
from src.DB_config import SECRET_KEY, MAIL_USERNAME, MAIL_PASSWORD, REDIS_PORT, REDIS_HOST

celery_app = Celery(
    "my_project",
    broker=f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
    backend=f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
)

# Опции Celery
celery_app.conf.update(
    result_expires=3600,
)

celery_app.conf.timezone = 'UTC'

# Конфигурация для отправки почты
conf = ConnectionConfig(
    MAIL_USERNAME=MAIL_USERNAME,
    MAIL_PASSWORD=MAIL_PASSWORD,
    MAIL_FROM=MAIL_USERNAME,
    MAIL_PORT=465,
    MAIL_SERVER="smtp.yandex.ru", # Указывать желаемый smtp
    MAIL_STARTTLS=False,  # Используется для TLS
    MAIL_SSL_TLS=True,  # Используется для SSL/TLS
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)


@shared_task
def send_reset_password_email(email: str, reset_link: str):
    """
    Задача для отправки ссылки для сброса пароля на email пользователя.

    :param email: Email пользователя, который запросил сброс пароля.
    :param reset_link: Ссылка для сброса пароля, которая включает токен сброса.
    """
    message = MessageSchema(
        subject="Reset your password",
        recipients=[email],
        body=f"To reset your password, please click the following link: {reset_link}",
        subtype="plain"
    )

    # Настройка FastMail и отправка сообщения
    # Сама FastMail и end_message асинхронна, а Celery синхронен, могут быть ошибки,
    # возможно есть пути получше решить данный конфликт
    fm = FastMail(conf)
    async_to_sync(fm.send_message)(message)
def create_verification_token(email: str, verification_code: str) -> str:
    expiration = datetime.utcnow() + timedelta(hours=1)  # Токен действителен 1 час
    payload = {
        "email": email,
        "verification_code": verification_code,
        "exp": expiration
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token
@shared_task
def send_verification_email(email: str, verification_code: str):
    verification_token = create_verification_token(email, verification_code)
    verification_link = f"http://localhost:3000/verify?token={verification_token}"  # Ссылка на клиентское приложение (заменить при dev версии)

    message = MessageSchema(
        subject="Verify your account",
        recipients=[email],
        body=f"To verify your account, please click the link: {verification_link}",
        subtype="plain"
    )

    # Настройка FastMail и отправка сообщения
    fm = FastMail(conf)
    async_to_sync(fm.send_message)(message)

# настройка переодических фоновых задач
celery_app.conf.beat_schedule = {
    'delete-inactive-users-every-10-minutes': {
        'task': 'schedule_user_deletion',
        'schedule': crontab(minute='*/5'),  # Каждые 10 минут
    },
}
DELETION_PERIOD = timedelta(minutes=3)
@celery_app.task(name="schedule_user_deletion", ignore_result=True)
def delete_inactive_users():
    """Синхронная задача для удаления неактивных пользователей."""
    loop = asyncio.get_event_loop()

    if loop.is_running():
        # Если цикл событий уже запущен, создаем новую задачу
        loop.create_task(delete_inactive_users_async())
    else:
        # Если цикла нет, запускаем асинхронную задачу
        loop.run_until_complete(delete_inactive_users_async())

async def delete_inactive_users_async():
    async for session in get_async_session():
        now = datetime.utcnow()

        # Ищем пользователей, которые не активны и зарегистрированы более 5 минут назад
        result = await session.execute(
            select(User).where(
                User.is_active == False,
                User.reg_at <= (now - DELETION_PERIOD)
            )
        )
        inactive_users = result.scalars().all()

        if not inactive_users:
            print("Не найдено неактивных пользователей для удаления.")
            return

        for user in inactive_users:
            user_id = user.id

            # Удаляем связанные записи из friends и user_info
            await session.execute(delete(Friends).where(Friends.owner_id == user_id))
            await session.execute(delete(UserInfo).where(UserInfo.user_id == user_id))

            # Удаляем самого пользователя
            await session.execute(delete(User).where(User.id == user_id))

        # Подтверждаем изменения
        await session.commit()

        print(f"Удалены {len(inactive_users)} неактивных пользователей.")
@celery_app.task
def send_reset_password_email(email: str, reset_code: str):
    message = MessageSchema(
        subject="Password Reset",
        recipients=[email],
        body=f"Your password reset code is: {reset_code}",
        subtype="plain"
    )
    fm = FastMail(conf)
    fm.send_message(message)
