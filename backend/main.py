from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI(title="FundingPro API")

class Grant(BaseModel):
    id: int
    title: str
    description: str
    amount: int

fake_grants = [
    Grant(id=1, title="Community Grant", description="Support for local projects", amount=10000),
    Grant(id=2, title="Research Grant", description="Academic research funding", amount=50000),
]

@app.get("/grants", response_model=List[Grant])
def list_grants():
    """List available grants (sample data)."""
    return fake_grants
