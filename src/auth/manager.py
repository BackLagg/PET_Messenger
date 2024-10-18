from typing import Optional

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, IntegerIDMixin

from src.DB_config import SECRET_KEY
from src.auth.models import User, UserInfo
from src.auth.utils import get_user_db, save_verification_code, generate_verification_code
from src.database import get_async_session
from src.friends.models import Friends
from src.tasks import send_verification_email, send_reset_password_email

SECRET = SECRET_KEY


class UserManager(IntegerIDMixin, BaseUserManager[User, int]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        async for session in get_async_session():
            # Создание пустой записи в таблице Friends
            new_friends_record = Friends(owner_id=user.id, friend_with=[])
            session.add(new_friends_record)

            # Создание записи в таблице UserInfo с дефолтными значениями None
            new_user_info_record = UserInfo(
                user_id=user.id,
                first_name=None,
                sec_name=None,
                last_name=None,
                pic_path=None
            )
            session.add(new_user_info_record)

            # Коммит для сохранения изменений
            await session.commit()

        # Генерация кода верификации
        verification_code = generate_verification_code()

        # Сохранение кода в базе или кэше
        await save_verification_code(user.email, verification_code)

        # Отправка кода на email
        send_verification_email.delay(user.email, verification_code)

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        reset_link = f"http://localhost:3000/api/reset?token={token}"
        send_reset_password_email.delay(user.email, reset_link)
        print(f"User {user.id} has forgot their password. Reset token: {token}")

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        print(f"Verification requested for user {user.id}. Verification token: {token}")

async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)
