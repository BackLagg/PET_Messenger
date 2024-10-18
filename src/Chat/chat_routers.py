import base64
import json
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User
from src.database import get_async_session
from src.Chat.models import Chat, Message
from src.auth.auth_cookie import fastapi_users
from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

chat_router = APIRouter()
current_user = fastapi_users.current_user()

# Роут для создания нового чата
@chat_router.post("/create_chat")
async def create_chat(
    second_user_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_user)
):
    # Проверяем, не создали ли уже чат с этим пользователем
    query = select(Chat).where(
        and_(
            Chat.participants.contains([user.id]),
            Chat.participants.contains([second_user_id])
        )
    )
    result = await session.execute(query)
    existing_chat = result.scalars().first()

    if second_user_id == user.id:
        raise HTTPException(status_code=400, detail="Нельзя создать чат с самим собой")

    if existing_chat:
        return {"chat_id": existing_chat.id, "status": "Chat allready created"}

    # Если чат не найден, создаем новый
    new_chat = Chat(participants=[user.id, second_user_id])
    session.add(new_chat)
    await session.commit()
    await session.refresh(new_chat)

    return {"chat_id": new_chat.id, "status": "Chat created"}

UPLOAD_DIRECTORY = "static/chat_pic"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, chat_id: int, websocket: WebSocket):
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = []
        self.active_connections[chat_id].append(websocket)

    def disconnect(self, chat_id: int, websocket: WebSocket):
        self.active_connections[chat_id].remove(websocket)
        if not self.active_connections[chat_id]:
            del self.active_connections[chat_id]

    async def send_message(self, chat_id: int, message: dict):
        # Сериализация сообщения в строку JSON
        message_str = json.dumps(message)
        for connection in self.active_connections.get(chat_id, []):
            await connection.send_text(message_str)

manager = ConnectionManager()

@chat_router.get("/current_user_get")
async def current_user_get(user: User = Depends(current_user)):
    return user.id
@chat_router.websocket("/ws/chat/{chat_id}")
async def chat_websocket(websocket: WebSocket,
                         chat_id: int,
                         db: AsyncSession = Depends(get_async_session)):
    await websocket.accept()
    data2 = await websocket.receive_text()
    user_data = json.loads(data2)
    user = user_data.get("userId")
    await manager.connect(chat_id, websocket)

    logger.info("Полученный токен: %s", [user])  # ПОТОМ УДАЛИТЬ

    # Проверка, является ли пользователь участником чата
    chat = await db.get(Chat, chat_id)
    if chat is None:
        logger.error(f"Чат с ID {chat_id} не найден")
        await websocket.close()
        return
    page = 1  # Начинаем с первой страницы
    page_size = 5
    if user not in chat.participants:
        logger.error(f"Пользователь {user} не является участником чата {chat_id}")
        await websocket.close()
        return

    result = await db.execute(
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.desc())
        .limit(page_size)
    )
    messages = result.scalars().all()

    # Отправляем их пользователю в обратном порядке (чтобы первые были самыми старыми)
    for message in reversed(messages):
        await websocket.send_json({
            "sender": message.sender,
            "text": message.text,
            "is_picture": message.is_picture,
            "created_at": str(message.created_at)
        })

    try:
        while True:
            data = await websocket.receive()
            if data["type"] == "websocket.disconnect":  # Обрабатываем разрыв соединения
                logger.info(f"Пользователь {user} отключился от чата {chat_id}")
                manager.disconnect(chat_id, websocket)
                break
            message_data = json.loads(data["text"])
            if 'loadMore' in message_data:  # Если запрос на загрузку следующей порции сообщений
                offset = page * page_size
                result = await db.execute(
                    select(Message)
                    .where(Message.chat_id == chat_id)
                    .order_by(Message.created_at.desc())
                    .offset(offset)
                    .limit(page_size)
                )
                messages = result.scalars().all()

                if not messages:
                    await websocket.send_json({"info": "Все сообщения загружены"})
                    continue

                # Отправляем их пользователю в обратном порядке
                for message in reversed(messages):
                    await websocket.send_json({
                        "sender": message.sender,
                        "text": message.text,
                        "is_picture": message.is_picture,
                        "created_at": str(message.created_at)
                    })

                page += 1
                continue
            # Проверка на тип полученных данных (бинарные или текстовые)
            if isinstance(data, dict) and 'file' in message_data:  # Получены бинарные данные (файл)
                base64_file = message_data['file']
                if base64_file.startswith('data:'):
                    base64_file = base64_file.split(',')[1]
                file_name = str(uuid.uuid4()) +'__$__'+ message_data['filename']  # Генерируем уникальный идентификатор для файла
                file_path = os.path.join(UPLOAD_DIRECTORY, file_name)
                decoded_data = base64.b64decode(base64_file)

                # Сохранение файла на диск
                with open(file_path, "wb") as file:
                    file.write(decoded_data)

                # Запись в базу данных
                message = Message(chat_id=chat_id, text=file_path, sender=user, is_picture=True)
                db.add(message)
                await db.commit()

                # Отправка клиентам ссылки на файл
                await manager.send_message(chat_id, {
                    "sender": user,
                    "text": file_path,  # Путь к файлу
                    "created_at": str(message.created_at),
                    "is_picture": True
                })

            else:  # Текстовые данные
                if not isinstance(data, dict) or "text" not in message_data:
                    logger.error(f"Некорректные данные: {message_data}")
                    continue
                message = Message(chat_id=chat_id, text=message_data["text"], sender=user, is_picture=False)
                # Сохранение сообщения в базе данных
                db.add(message)
                await db.commit()

                # Широковещательная отправка сообщения другим подключенным клиентам
                await manager.send_message(chat_id, {
                    "sender": user,
                    "text": message_data["text"],
                    "created_at": str(message.created_at),
                    "is_picture": False
                })
    except WebSocketDisconnect:
        manager.disconnect(chat_id, websocket)

@chat_router.get("/my_chats")
async def my_chats(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_async_session)
):
    # Запрос для получения чатов, в которых участвует пользователь
    chat_query = select(Chat).where(Chat.participants.contains([user.id]))
    result = await session.execute(chat_query)
    chats = result.scalars().all()

    if not chats:
        return {"status": "No chats found"}

    chat_list = []

    # Для каждого чата ищем последнее сообщение и имя другого участника
    for chat in chats:
        message_query = select(Message).where(Message.chat_id == chat.id).order_by(desc(Message.created_at)).limit(1)
        message_result = await session.execute(message_query)
        last_message = message_result.scalars().first()

        # Найти ID другого участника чата
        other_user_id = next((uid for uid in chat.participants if uid != user.id), None)
        other_user = None

        if other_user_id is not None:
            user_query = select(User).where(User.id == other_user_id)
            user_result = await session.execute(user_query)
            other_user = user_result.scalars().first()

        chat_info = {
            "chat_id": chat.id,
            "last_message": last_message.text if last_message else None,
            "username": other_user.username if other_user else None  # Имя другого участника
        }

        chat_list.append(chat_info)

    return {"chats": chat_list}


