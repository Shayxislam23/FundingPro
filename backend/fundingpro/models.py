from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    is_admin: bool = False
    applications: list["Application"] = Relationship(back_populates="user")

class Grant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    amount: int
    deadline: datetime
    eligibility: str
    applications: list["Application"] = Relationship(back_populates="grant")

class Application(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    grant_id: int = Field(foreign_key="grant.id")
    status: str = "draft"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user: Optional[User] = Relationship(back_populates="applications")
    grant: Optional[Grant] = Relationship(back_populates="applications")
