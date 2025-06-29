from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from enum import Enum

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str


class Role(str, Enum):
    admin = "admin"
    owner = "owner"
    editor = "editor"
    viewer = "viewer"

class UserRead(BaseModel):
    id: int
    email: EmailStr
    role: Role
    is_verified: bool
    subscription_status: str

    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class GrantRead(BaseModel):
    id: int
    title: str
    description: str
    amount: int
    deadline: datetime
    eligibility: str

    class Config:
        orm_mode = True

class GrantCreate(BaseModel):
    title: str
    description: str
    amount: int
    deadline: datetime
    eligibility: str

class ApplicationCreate(BaseModel):
    grant_id: int

class ApplicationRead(BaseModel):
    id: int
    grant: GrantRead
    status: str
    created_at: datetime

    class Config:
        orm_mode = True


class AuditLogRead(BaseModel):
    id: int
    user_id: int
    action: str
    details: str
    timestamp: datetime
