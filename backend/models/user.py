from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from pydantic import BaseModel, EmailStr, Field, validator

from .base import BaseDBModel, BaseSchema

# 사용자-역할 관계 테이블
user_role = Table(
    'user_role',
    BaseDBModel.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('role_id', Integer, ForeignKey('roles.id'))
)

class User(BaseDBModel):
    """
    사용자 데이터베이스 모델
    """
    __tablename__ = "users"
    
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=True)
    hashed_password = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    
    # 관계 설정
    roles = relationship("Role", secondary=user_role, back_populates="users")
    tenders = relationship("Tender", back_populates="owner")
    documents = relationship("Document", back_populates="creator")
    
    def __repr__(self):
        return f"<User {self.username}>"

class Role(BaseDBModel):
    """
    사용자 역할 데이터베이스 모델
    """
    __tablename__ = "roles"
    
    name = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(200), nullable=True)
    permissions = Column(String(500), nullable=True)  # JSON 문자열로 저장된 권한 목록
    
    # 관계 설정
    users = relationship("User", secondary=user_role, back_populates="roles")
    
    def __repr__(self):
        return f"<Role {self.name}>"

# Pydantic 스키마 모델
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleUpdate(RoleBase):
    name: Optional[str] = None

class RoleInDBBase(RoleBase, BaseSchema):
    id: Optional[int] = None

class Role(RoleInDBBase):
    pass

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('비밀번호는 최소 8자 이상이어야 합니다')
        return v

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    
    @validator('password')
    def password_min_length(cls, v):
        if v is not None and len(v) < 8:
            raise ValueError('비밀번호는 최소 8자 이상이어야 합니다')
        return v

class UserInDBBase(UserBase, BaseSchema):
    id: Optional[int] = None
    hashed_password: str
    last_login: Optional[datetime] = None

class User(UserInDBBase):
    roles: List[Role] = []

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None
    expires_at: datetime

class TokenPayload(BaseModel):
    sub: Optional[int] = None
    exp: Optional[datetime] = None
