from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserRead(BaseModel):
    id: int
    email: EmailStr
    is_admin: bool

class GrantRead(BaseModel):
    id: int
    title: str
    description: str
    amount: int
    deadline: datetime
    eligibility: str

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


class AuditLogRead(BaseModel):
    id: int
    user_id: int
    action: str
    details: str
    timestamp: datetime
