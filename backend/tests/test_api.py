import os
os.environ["DATABASE_URL"] = "sqlite:////tmp/test.db"
from fastapi.testclient import TestClient
from fundingpro.main import app
from sqlmodel import select, Session
from fundingpro.database import init_db


def setup_function():
    import os
    from fundingpro.database import engine
    if os.path.exists('/tmp/test.db'):
        os.remove('/tmp/test.db')
    engine.dispose()
    init_db()

client = TestClient(app)


def test_register_and_login():
    r = client.post("/users/register", json={"email": "test@example.com", "password": "secret"})
    assert r.status_code == 200
    from fundingpro.database import engine
    from fundingpro.models import User
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == "test@example.com")).first()
        client.post("/users/verify", params={"token": user.verification_token})
    token_resp = client.post("/users/login", data={"username": "test@example.com", "password": "secret"})
    assert token_resp.status_code == 200
    token = token_resp.json()["access_token"]
    assert token


def test_create_grant_admin():
    client.post("/users/register", json={"email": "admin@example.com", "password": "admin"})
    from fundingpro.database import engine
    from fundingpro.models import User
    with Session(engine) as session:
        admin = session.exec(select(User).where(User.email == "admin@example.com")).first()
        admin.role = "admin"
        admin.is_verified = True
        session.add(admin)
        session.commit()
    token = client.post("/users/login", data={"username": "admin@example.com", "password": "admin"}).json()["access_token"]
    r = client.post("/admin/grants", json={"title": "Test", "description": "Desc", "amount": 1000, "deadline": "2030-01-01T00:00:00", "eligibility": "Any"}, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200


def test_application_crud():
    client.post("/users/register", json={"email": "u2@example.com", "password": "pw"})
    from fundingpro.database import engine
    from fundingpro.models import User, Grant
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == "u2@example.com")).first()
        user.is_verified = True
        session.add(Grant(title="G1", description="d", amount=1, deadline="2030-01-01T00:00:00", eligibility="any"))
        session.commit()
        grant = session.exec(select(Grant)).first()
    token = client.post("/users/login", data={"username": "u2@example.com", "password": "pw"}).json()["access_token"]
    app_resp = client.post("/applications", json={"grant_id": grant.id}, headers={"Authorization": f"Bearer {token}"})
    assert app_resp.status_code == 200
    app_id = app_resp.json()["id"]
    upd = client.put(f"/applications/{app_id}", params={"status": "submitted"}, headers={"Authorization": f"Bearer {token}"})
    assert upd.status_code == 200
    dele = client.delete(f"/applications/{app_id}", headers={"Authorization": f"Bearer {token}"})
    assert dele.status_code == 200
