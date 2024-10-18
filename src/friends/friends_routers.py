from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy import or_, update, delete

from src.auth.models import User, UserInfo
from src.database import get_async_session
from src.friends.models import Friends, FriendRequest
from src.friends.schemas import FriendRequestCreate, FriendRequestData
from src.auth.auth_cookie import fastapi_users

current_user = fastapi_users.current_user()
friend_router = APIRouter()

# Роут поиска пользователей по username
@friend_router.get("/search_users")
async def search_users(username: str, session: AsyncSession = Depends(get_async_session)):
    query = select(User).options(joinedload(User.user_info)).where(User.username.ilike(f"%{username}%"))
    result = await session.execute(query)
    users = result.scalars().all()

    if not users:
        raise HTTPException(status_code=404, detail="No users found")

    return [
        {
            "id": user.id,
            "username": user.username,
            "first_name": user.user_info.first_name,
            "sec_name": user.user_info.sec_name,
            "last_name": user.user_info.last_name,
            "pic_path": user.user_info.pic_path
        }
        for user in users
    ]

# Роут отправки запроса в друзья

@friend_router.post("/add_friend")
async def add_friend(
    friend_request: FriendRequestCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_user)
):
    if user.id == friend_request.receiver_id:
        raise HTTPException(status_code=400, detail="You cannot send a friend request to yourself")

    # Проверка, существует ли пользователь
    user_exists_query = select(User).where(User.id == friend_request.receiver_id)
    user_exists_result = await session.execute(user_exists_query)
    receiver_user = user_exists_result.scalars().first()

    if not receiver_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Объединённый запрос для проверки существования запросов в друзья
    friend_request_query = select(FriendRequest).where(
        or_(
            (FriendRequest.sender_id == user.id) & (FriendRequest.receiver_id == friend_request.receiver_id),
            (FriendRequest.sender_id == friend_request.receiver_id) & (FriendRequest.receiver_id == user.id)
        )
    )
    result = await session.execute(friend_request_query)
    existing_request = result.scalars().first()

    # Проверка на существующий запрос в друзья
    if existing_request:
        raise HTTPException(status_code=400, detail="Friend request already exists")

    # Проверка, являются ли уже друзьями
    friends_query = select(Friends).where(Friends.owner_id == user.id)
    friend_result = await session.execute(friends_query)
    user_friends = friend_result.scalars().first()

    if user_friends and friend_request.receiver_id in user_friends.friend_with:
        raise HTTPException(status_code=400, detail="You are already friends")

    # Создание нового запроса в друзья
    new_request = FriendRequest(sender_id=user.id, receiver_id=friend_request.receiver_id)
    session.add(new_request)
    await session.commit()
    return {"status": "Friend request sent"}

@friend_router.post("/accept_friend_request")
async def accept_friend_request(
    request_data: FriendRequestData,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_user)
):
    # Извлекаем необходимые данные из JSON
    friend_request_id = request_data.req_id
    is_accepted = request_data.isAsepted

    # Поиск запроса в друзья по его ID
    query = select(FriendRequest).where(FriendRequest.id == friend_request_id)
    result = await session.execute(query)
    friend_request = result.scalars().first()

    if not friend_request:
        raise HTTPException(status_code=404, detail="Friend request not found")

    if friend_request.sender_id == user.id and not is_accepted:
        delete_query = delete(FriendRequest).where(FriendRequest.id == friend_request_id)
        await session.execute(delete_query)
        await session.commit()
        return {"status": "Friend request accepted" if is_accepted else "Friend request deleted"}

    # Проверка, является ли текущий пользователь получателем запроса
    if friend_request.sender_id == user.id or user.id != friend_request.receiver_id:
        raise HTTPException(status_code=400, detail="You are not authorized to accept this friend request")

    if is_accepted:
        # Добавление пользователей в списки друзей
        update_sender_friends_query = update(Friends).where(Friends.owner_id == user.id).values(
            friend_with=Friends.friend_with + [friend_request.sender_id]
        )
        update_receiver_friends_query = update(Friends).where(Friends.owner_id == friend_request.sender_id).values(
            friend_with=Friends.friend_with + [user.id]
        )

        await session.execute(update_sender_friends_query)
        await session.execute(update_receiver_friends_query)

    # Удаление записи о запросе в друзья
    delete_query = delete(FriendRequest).where(FriendRequest.id == friend_request_id)
    await session.execute(delete_query)
    await session.commit()

    return {"status": "Friend request accepted" if is_accepted else "Friend request deleted"}

@friend_router.get("/show_my_friends")
async def show_my_friends(
    user: User = Depends(current_user),  # Получаем авторизованного пользователя
    session: AsyncSession = Depends(get_async_session)
):
    # Находим запись о друзьях по owner_id
    query = select(Friends).where(Friends.owner_id == user.id)
    result = await session.execute(query)
    friends_record = result.scalar()

    if not friends_record:
        return []  # Если друзей нет, возвращаем пустой список

    # Список ID друзей из friend_with
    friend_ids = friends_record.friend_with  # Предполагается, что это JSONB-список ID

    # Если список друзей пустой
    if not friend_ids:
        return []  # Пустой ответ, если у пользователя нет друзей

    # Получаем информацию о друзьях по их ID
    friends_query = (
        select(User, UserInfo)
        .join(UserInfo, User.id == UserInfo.user_id)  # Присоединяем таблицу user_info
        .where(User.id.in_(friend_ids))  # Фильтруем по списку ID друзей
    )
    friends_result = await session.execute(friends_query)
    friends_data = friends_result.all()

    # Формируем ответ в нужном формате
    friends_list = [
        {
            "id": friend_user.id,
            "username": friend_user.username,
            "first_name": friend_info.first_name,
            "sec_name": friend_info.sec_name,
            "last_name": friend_info.last_name,
            "pic_path": friend_info.pic_path
        }
        for friend_user, friend_info in friends_data
    ]

    return friends_list


@friend_router.get("/my_friend_requests")
async def my_friend_requests(
    user: User = Depends(current_user),  # Авторизованный пользователь
    session: AsyncSession = Depends(get_async_session)
):
    # Запросы от меня
    sent_requests_query = (
        select(FriendRequest, User, UserInfo)
        .join(User, User.id == FriendRequest.receiver_id)  # Присоединяем таблицу User для информации о получателе
        .join(UserInfo, User.id == UserInfo.user_id)  # Присоединяем таблицу UserInfo для получения ФИО
        .where(FriendRequest.sender_id == user.id)  # Фильтруем по sender_id
    )
    sent_requests_result = await session.execute(sent_requests_query)
    sent_requests_data = sent_requests_result.all()

    sent_requests = [
        {
            "id": receiver_user.id,
            "req_id": request.id,
            "username": receiver_user.username,
            "first_name": receiver_user_info.first_name,
            "sec_name": receiver_user_info.sec_name,
            "last_name": receiver_user_info.last_name
        }
        for request, receiver_user, receiver_user_info in sent_requests_data
    ]

    # Запросы ко мне
    received_requests_query = (
        select(FriendRequest, User, UserInfo)
        .join(User, User.id == FriendRequest.sender_id)  # Присоединяем таблицу User для информации об отправителе
        .join(UserInfo, User.id == UserInfo.user_id)  # Присоединяем таблицу UserInfo для получения ФИО
        .where(FriendRequest.receiver_id == user.id)  # Фильтруем по receiver_id
    )
    received_requests_result = await session.execute(received_requests_query)
    received_requests_data = received_requests_result.all()

    received_requests = [
        {
            "id": sender_user.id,
            "req_id": request.id,
            "username": sender_user.username,
            "first_name": sender_user_info.first_name,
            "sec_name": sender_user_info.sec_name,
            "last_name": sender_user_info.last_name
        }
        for request, sender_user, sender_user_info in received_requests_data
    ]

    # Возвращаем ответ с двумя подзаголовками
    return {
        "my_request": sent_requests,  # Запросы от меня
        "request_to_me": received_requests  # Запросы ко мне
    }
