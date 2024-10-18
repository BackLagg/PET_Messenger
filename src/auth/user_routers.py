from datetime import datetime

import jwt
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi_users.exceptions import UserNotExists, InvalidResetPasswordToken
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.DB_config import SECRET_KEY
from src.auth.auth_cookie import fastapi_users
from src.auth.manager import UserManager, get_user_manager
from src.auth.models import User, UserInfo
from src.auth.schemas import UserInfoCreate, TokenSchema, ChangePasswordRequest, ResetPasswordRequest, \
    ForgotPasswordRequest
from src.auth.utils import verify_verification_code, generate_verification_code, get_user_db
from src.database import get_async_session

import os
import logging

user_db = get_user_db()
logging.basicConfig(level=logging.INFO)

# Создаем роутер для user_info
user_info_router = APIRouter()

# Получение текущего пользователя
current_user = fastapi_users.current_user()

# Укажите путь к директории, где будут храниться загруженные изображения
AVATARS_DIRECTORY = "static/avatars"

# Создание директории, если её нет
os.makedirs(AVATARS_DIRECTORY, exist_ok=True)

# Эндпоинт для получения информации о текущем пользователе
@user_info_router.get("/user_info_show")
async def get_user_info(
    user: User = Depends(current_user),  # Получаем текущего пользователя
    session: AsyncSession = Depends(get_async_session)  # Асинхронная сессия
):
    try:
        # Запрос для получения информации о пользователе по user_id
        query = select(UserInfo).where(UserInfo.user_id == user.id)
        result = await session.execute(query)
        user_info_record = result.scalars().first()

        if user_info_record:
            # Если запись найдена, возвращаем информацию
            return {
                "first_name": user_info_record.first_name,
                "sec_name": user_info_record.sec_name,
                "last_name": user_info_record.last_name,
                "pic_path": user_info_record.pic_path
            }
        else:
            # Если запись не найдена, возвращаем ошибку
            raise HTTPException(status_code=404, detail="User info not found")

    except Exception as e:
        print(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Эндпоинт для создания или обновления информации о пользователе
@user_info_router.post("/user_info_add", response_model=UserInfoCreate)
async def create_or_update_user_info(
        info: UserInfoCreate,
        session: AsyncSession = Depends(get_async_session),
        user: User = Depends(current_user)
):
    # Поиск информации о пользователе
    query = select(UserInfo).where(UserInfo.user_id == user.id)
    result = await session.execute(query)
    user_info_record = result.scalars().first()

    if user_info_record:
        # Если информация существует, обновляем только те поля, которые были переданы
        if info.first_name is not None:
            user_info_record.first_name = info.first_name
        if info.sec_name is not None:
            user_info_record.sec_name = info.sec_name
        if info.last_name is not None:
            user_info_record.last_name = info.last_name
        if info.pic_path is not None:
            user_info_record.pic_path = info.pic_path
    else:
        # Если информации нет, создаем новую запись
        user_info_record = UserInfo(
            user_id=user.id,
            first_name=info.first_name,
            sec_name=info.sec_name,
            last_name=info.last_name,
            pic_path=info.pic_path,
        )
        session.add(user_info_record)

    await session.commit()
    await session.refresh(user_info_record)

    return user_info_record


@user_info_router.post("/upload")
async def upload_avatar(file: UploadFile = File(...)):
    # Проверка расширения файла
    if not file.filename.endswith(('.png', '.jpg', '.jpeg', '.gif')):
        raise HTTPException(status_code=400, detail="Некорректный формат файла. Допустимы только PNG и JPG.")

    # Определение пути сохранения
    file_location = os.path.join(AVATARS_DIRECTORY, file.filename)

    # Сохранение файла
    with open(file_location, "wb") as file_object:
        file_object.write(await file.read())

    # Возврат пути к загруженному файлу
    return JSONResponse(content={"filename": file.filename, "url": f"/{file_location}"})


@user_info_router.post("/verify")
async def verify_user(data: TokenSchema, session: AsyncSession = Depends(get_async_session)):
    token = data.token
    try:
        print(token)
        # Декодируем JWT токен
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = payload.get("email")
        verification_code = payload.get("verification_code")
        exp = payload.get("exp")

        # Проверяем, не истёк ли срок действия токена
        if datetime.utcnow().timestamp() > exp:
            raise HTTPException(status_code=400, detail="Токен истёк.")

        # Проверяем код верификации в Redis
        if await verify_verification_code(email, verification_code):
            # Получаем пользователя по email напрямую через запрос в базу данных
            result = await session.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()

            if user:
                user.is_active = True  # Активируем пользователя
                await session.commit()  # Сохраняем изменения в базе данных
                return {"success": True, "message": "Пользователь успешно активирован!"}
            else:
                raise HTTPException(status_code=404, detail="Пользователь не найден.")
        else:
            raise HTTPException(status_code=400, detail="Неверный код верификации.")

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Токен истёк.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Некорректный токен.")


@user_info_router.post("/change-password")
async def change_password(
        change_password_data: ChangePasswordRequest,
        user: User = Depends(current_user),
        user_manager: UserManager = Depends(get_user_manager)
):
    # Проверяем старый пароль с помощью password_helper.verify_and_update
    valid_password, _ = user_manager.password_helper.verify_and_update(
        change_password_data.old_password, user.hashed_password
    )

    if not valid_password:
        raise HTTPException(status_code=400, detail="Incorrect old password")

    # Хэшируем новый пароль с помощью password_helper.hash
    hashed_new_password = user_manager.password_helper.hash(change_password_data.new_password)
    user.hashed_password = hashed_new_password

    async for session in get_async_session():
        await session.merge(user)  # Объединяем изменения
        await session.commit()

    return {"status": "Password changed successfully"}

@user_info_router.post("/forgot-password")
async def forgot_password(
        forgot_password_data: ForgotPasswordRequest,
        user_manager: UserManager = Depends(get_user_manager),
):
    # Попробуем найти пользователя по email
    user = await user_manager.get_by_email(forgot_password_data.email)

    if not user:
        raise HTTPException(status_code=404, detail="User with this email does not exist")

    # Передаём объект пользователя во встроенный метод forgot_password
    await user_manager.forgot_password(user)

    return {"message": "Password reset email sent"}

# Маршрут для сброса пароля
@user_info_router.post("/reset-password")
async def reset_password(
    reset_password_data: ResetPasswordRequest,
    user_manager: UserManager = Depends(get_user_manager),
):
    try:
        await user_manager.reset_password(reset_password_data.token, reset_password_data.new_password)
        return {"message": "Password has been reset"}
    except InvalidResetPasswordToken:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
