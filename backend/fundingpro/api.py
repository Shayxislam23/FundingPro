from fastapi import APIRouter, Depends, HTTPException, status
from fastapi import Request
from sqlmodel import select
from sqlalchemy.exc import NoResultFound
from .database import get_session
from .models import User, Grant, Application, AuditLog, Role
from .schemas import (
    UserCreate, UserRead, UserUpdate, Token, GrantCreate, GrantRead,
    ApplicationCreate, ApplicationRead, AuditLogRead,
)
from .auth import (
    get_password_hash, verify_password,
    create_access_token, decode_token
)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List
from pydantic import EmailStr
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
    user = User(email=data.email,
                hashed_password=get_password_hash(data.password),
                verification_token=os.urandom(16).hex())
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.post("/users/verify")
def verify_email(token: str, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.verification_token == token)).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    user.is_verified = True
    user.verification_token = None
    session.add(AuditLog(user_id=user.id, action="verify", details=""))
    session.commit()
    return {"status": "verified"}


@router.post("/users/request-password-reset")
def request_reset(email: EmailStr, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == email)).first()
    if user:
        user.reset_token = os.urandom(16).hex()
        session.commit()
        # send email in real system
        return {"reset_token": user.reset_token}
    return {"message": "ok"}


@router.post("/users/reset-password")
def reset_password(token: str, password: str, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.reset_token == token)).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    user.hashed_password = get_password_hash(password)
    user.reset_token = None
    session.commit()
    return {"status": "reset"}


@router.get("/users/me", response_model=UserRead)
def read_me(user: User = Depends(get_current_user)):
    return user


@router.put("/users/me", response_model=UserRead)
def update_me(data: UserUpdate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if data.email:
        user.email = data.email
    if data.password:
        user.hashed_password = get_password_hash(data.password)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.post("/users/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Email not verified")
    session.add(AuditLog(user_id=user.id, action="login", details="success"))
    session.commit()
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


@router.put("/applications/{app_id}", response_model=ApplicationRead)
def update_application(app_id: int, status: str, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    app = session.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Not found")
    if app.user_id != user.id and user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    app.status = status
    session.add(AuditLog(user_id=user.id, action="update_application", details=f"id={app_id},status={status}"))
    session.commit()
    grant = session.get(Grant, app.grant_id)
    return ApplicationRead(id=app.id, grant=grant, status=app.status, created_at=app.created_at)


@router.delete("/applications/{app_id}")
def delete_application(app_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    app = session.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Not found")
    if app.user_id != user.id and user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    session.delete(app)
    session.add(AuditLog(user_id=user.id, action="delete_application", details=f"id={app_id}"))
    session.commit()
    return {"status": "deleted"}

# Admin endpoints
@router.post("/admin/grants", response_model=GrantRead)
def create_grant(data: GrantCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if user.role != Role.admin:
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


@router.post('/billing/webhook')
async def stripe_webhook(request: Request, session: Session = Depends(get_session)):
    payload = await request.body()
    sig = request.headers.get('stripe-signature')
    wh_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    try:
        event = stripe.Webhook.construct_event(payload, sig, wh_secret)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid payload')
    if event['type'] == 'customer.subscription.updated':
        obj = event['data']['object']
        customer = obj['customer']
        status = obj['status']
        user = session.exec(select(User).where(User.stripe_customer_id == customer)).first()
        if user:
            user.subscription_status = status
            session.commit()
    return {"received": True}

@router.get('/admin/audit', response_model=List[AuditLogRead])
def list_audit(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if user.role != Role.admin:
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


@router.post('/draft')
def draft(data: dict, user: User = Depends(get_current_user)):
    return generate_application(data, user)
