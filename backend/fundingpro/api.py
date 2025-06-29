from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlalchemy.exc import NoResultFound
from .database import get_session
from .models import User, Grant, Application, AuditLog
from .schemas import (
    UserCreate, UserRead, Token, GrantCreate, GrantRead,
    ApplicationCreate, ApplicationRead, AuditLogRead
)
from .auth import (
    get_password_hash, verify_password,
    create_access_token, decode_token
)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List
from sqlmodel import Session
import stripe
from openai import OpenAI
import os

router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

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
def list_grants(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    grants = session.exec(select(Grant)).all()
    return grants

@router.get("/grants/{grant_id}", response_model=GrantRead)
def get_grant(grant_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
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
    session.add(AuditLog(user_id=user.id, action="create_application", details=f"grant={grant.id}"))
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
    session.add(AuditLog(user_id=user.id, action="create_grant", details=f"grant={data.title}"))
    session.commit()
    session.refresh(grant)
    return grant

# Billing
@router.post('/billing/create-checkout-session')
def create_checkout_session(user: User = Depends(get_current_user)):
    price_id = os.getenv('STRIPE_PRICE_ID')
    if not price_id:
        raise HTTPException(status_code=500, detail='Billing not configured')
    stripe_session = stripe.checkout.Session.create(
        mode='subscription',
        line_items=[{'price': price_id, 'quantity': 1}],
        success_url='https://example.com/success',
        cancel_url='https://example.com/cancel',
        customer_email=user.email,
    )
    return {'checkout_url': stripe_session.url}

@router.get('/admin/audit', response_model=List[AuditLogRead])
def list_audit(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail='Not authorized')
    logs = session.exec(select(AuditLog).order_by(AuditLog.timestamp.desc())).all()
    return logs

openai_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_api_key) if openai_api_key else None

@router.post('/ai/generate-application')
def generate_application(data: dict, user: User = Depends(get_current_user)):
    if not client:
        raise HTTPException(status_code=500, detail='AI service not configured')
    prompt = (
        f"Project: {data.get('project_name')}\n"
        f"Budget: {data.get('budget')}\n"
        f"Description: {data.get('description')}\n"
        "Write a grant application proposal."
    )
    completion = client.chat.completions.create(model='gpt-4', messages=[{"role": "user", "content": prompt}])
    return {"draft": completion.choices[0].message.content}
