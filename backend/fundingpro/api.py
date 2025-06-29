from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlalchemy.exc import NoResultFound
from .database import get_session
from .models import User, Grant, Application
from .schemas import (
    UserCreate, UserRead, Token, GrantCreate, GrantRead,
    ApplicationCreate, ApplicationRead
)
from .auth import (
    get_password_hash, verify_password,
    create_access_token, decode_token
)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List
from sqlmodel import Session

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")


def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = session.get(User, payload.get("sub"))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/users/register", response_model=UserRead)
def register(data: UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, hashed_password=get_password_hash(data.password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.post("/users/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    token = create_access_token({"sub": user.id})
    return Token(access_token=token)

@router.get("/grants", response_model=List[GrantRead])
def list_grants(session: Session = Depends(get_session)):
    grants = session.exec(select(Grant)).all()
    return grants

@router.get("/grants/{grant_id}", response_model=GrantRead)
def get_grant(grant_id: int, session: Session = Depends(get_session)):
    grant = session.get(Grant, grant_id)
    if not grant:
        raise HTTPException(status_code=404, detail="Grant not found")
    return grant

@router.post("/applications", response_model=ApplicationRead)
def create_application(data: ApplicationCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    grant = session.get(Grant, data.grant_id)
    if not grant:
        raise HTTPException(status_code=404, detail="Grant not found")
    app = Application(user_id=user.id, grant_id=grant.id)
    session.add(app)
    session.commit()
    session.refresh(app)
    return ApplicationRead(id=app.id, grant=grant, status=app.status, created_at=app.created_at)

@router.get("/applications", response_model=List[ApplicationRead])
def list_applications(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    apps = session.exec(select(Application).where(Application.user_id == user.id)).all()
    result = []
    for app in apps:
        grant = session.get(Grant, app.grant_id)
        result.append(ApplicationRead(id=app.id, grant=grant, status=app.status, created_at=app.created_at))
    return result

# Admin endpoints
@router.post("/admin/grants", response_model=GrantRead)
def create_grant(data: GrantCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    grant = Grant(**data.dict())
    session.add(grant)
    session.commit()
    session.refresh(grant)
    return grant
from openai import OpenAI
import os

openai_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_api_key) if openai_api_key else None

@router.post('/ai/draft')
def draft_application(prompt: str, user: User = Depends(get_current_user)):
    if not client:
        raise HTTPException(status_code=500, detail='AI service not configured')
    completion = client.chat.completions.create(model='gpt-4', messages=[{"role": "user", "content": prompt}])
    return {"draft": completion.choices[0].message.content}
