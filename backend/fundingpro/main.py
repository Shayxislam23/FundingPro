from fastapi import FastAPI
from .database import init_db
from .api import router

app = FastAPI(title="FundingPro API")

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(router)
