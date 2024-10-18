from typing import Optional
from pydantic import BaseModel, Field, EmailStr, constr
from fastapi_users import schemas

class UserRead(schemas.BaseUser[int]):
    id: int
    email: str
    username: str
    is_active: bool = True
    is_superuser: bool = False
    is_verified: bool = False


class UserCreate(schemas.BaseUserCreate):
    email: str
    username: str
    password: str
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False
    is_verified: Optional[bool] = False

class UserInfoCreate(BaseModel):
    first_name: Optional[str]
    sec_name: Optional[str]
    last_name: Optional[str]
    pic_path: Optional[str]

class UserInfoUpdate(BaseModel):
    first_name: Optional[str]
    sec_name: Optional[str]
    last_name: Optional[str]
    pic_path: Optional[str]


class TokenSchema(BaseModel):
    token: str

class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=4, max_length=100, description="Старый пароль пользователя")
    new_password: str = Field(..., min_length=4, max_length=100, description="Новый пароль пользователя")

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# Схема для сброса пароля (reset password)
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: constr(min_length=4)