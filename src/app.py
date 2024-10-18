from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.auth_cookie import auth_backend, fastapi_users
from src.auth.models import User, UserInfo
from src.auth.schemas import UserRead, UserCreate
from src.auth.user_routers import user_info_router
from src.database import get_async_session
from src.friends.friends_routers import friend_router
from src.Chat.chat_routers import chat_router
from fastapi.staticfiles import StaticFiles
from prometheus_client import start_http_server, Summary
from starlette.responses import Response

app = FastAPI(title="Massanger")
current_user = fastapi_users.current_user()
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)

app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)

app.include_router(user_info_router, tags=["User_info"])
app.include_router(friend_router, tags=["friends"])
app.include_router(chat_router, tags=["chat"])

@app.get("/protected-route")
async def protected_route(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_async_session)
):
    # Получаем дополнительную информацию о пользователе из таблицы user_info
    query = select(UserInfo).where(UserInfo.user_id == user.id)
    result = await session.execute(query)
    user_info = result.scalar()

    if not user_info:
        raise HTTPException(status_code=404, detail="User info not found")

    # Возвращаем username, ФИО и путь к изображению
    return {
        "username": user.username,
        "first_name": user_info.first_name,
        "sec_name": user_info.sec_name,
        "last_name": user_info.last_name,
        "pic_path": user_info.pic_path
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://192.168.100.10:3000"],  # Разрешаем запросы с React-приложения
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PATCH", "PUT","*"],
    allow_headers=["Content-Type", "Set-Cookie", "Access-Control-Allow-Headers", "Access-Control-Allow-Origin",
                   "Authorization","*"],
)

REQUEST_TIME = Summary('request_processing_seconds', 'Time spent processing request')

@app.middleware("http")
async def add_process_time_header(request, call_next):
    with REQUEST_TIME.time():
        response = await call_next(request)
    return response

@app.get("/metrics")
async def get_metrics():
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)