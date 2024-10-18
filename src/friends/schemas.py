from pydantic import BaseModel
from typing import List

class FriendsCreate(BaseModel):
    owner_id: int
    friend_with: List[int]  # List of friend IDs

    class Config:
        orm_mode = True

class FriendRequestCreate(BaseModel):
    sender_id: int
    receiver_id: int

    class Config:
        from_attributes = True

class FriendRequestData(BaseModel):
    req_id: int
    isAsepted: bool

    class Config:
        from_attributes = True