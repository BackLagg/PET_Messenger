from fastapi import Depends
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from src.DB_config import REDIS_PORT, REDIS_HOST
from src.auth.models import User
from src.database import get_async_session
import aioredis

import random
import string

redis = aioredis.from_url(f"redis://{REDIS_HOST}:{REDIS_PORT}")

async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)

def generate_verification_code(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))

async def save_verification_code(email: str, code: str):
    await redis.set(email, code, ex=240)  # Сохраняем код с истечением через 10 минут

async def verify_verification_code(email: str, code: str) -> bool:
    stored_code = await redis.get(email)
    if stored_code and stored_code.decode('utf-8') == code:
        await redis.delete(email)  # Удаляем код после успешной проверки
        return True
    return False