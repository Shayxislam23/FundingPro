import os
os.environ["DATABASE_URL"] = "sqlite:////tmp/test.db"
from fastapi.testclient import TestClient
from fundingpro.main import app
from sqlmodel import select, Session
from fundingpro.database import init_db


def setup_function():
    init_db()

client = TestClient(app)


def test_register_and_login():
    r = client.post("/users/register", json={"email": "test@example.com", "password": "secret"})
    assert r.status_code == 200
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
        admin.is_admin = True
        session.add(admin)
        session.commit()
    token = client.post("/users/login", data={"username": "admin@example.com", "password": "admin"}).json()["access_token"]
    r = client.post("/admin/grants", json={"title": "Test", "description": "Desc", "amount": 1000, "deadline": "2030-01-01T00:00:00", "eligibility": "Any"}, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
