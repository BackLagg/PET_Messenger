from pydantic import BaseModel
from typing import List

# Schema for the Friends table
class FriendsCreate(BaseModel):
    owner_id: int
    friend_with: List[int]  # List of friend IDs

    class Config:
        orm_mode = True

# Schema for the Friend Request table
class FriendRequestCreate(BaseModel):
    sender_id: int
    receiver_id: int

    class Config:
        from_attributes = True

# Определяем модель для входящих данных
class FriendRequestData(BaseModel):
    req_id: int
    isAsepted: bool

    class Config:
        from_attributes = True