from datetime import datetime

from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTable
from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from src.database import Base


class UserInfo(Base):
    __tablename__ = 'user_info'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    first_name = Column(String, nullable=True)
    sec_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    pic_path = Column(String, nullable=True)
    user = relationship("User", back_populates="user_info")


class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = 'user'
    id = Column("id", Integer, primary_key=True)
    email = Column("email", String, nullable=False)
    username = Column("username", String, nullable=False)
    reg_at = Column("reg_at", TIMESTAMP, default=datetime.utcnow())
    hashed_password: str = Column(String(length=1024), nullable=False)
    is_active: bool = Column(Boolean, default=False, nullable=False)
    is_superuser: bool = Column(Boolean, default=False, nullable=False)
    is_verified: bool = Column(Boolean, default=False, nullable=False)
    user_info = relationship("UserInfo", back_populates="user", uselist=False)