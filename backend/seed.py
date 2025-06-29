from fundingpro.database import init_db, engine
from fundingpro.models import Grant
from sqlmodel import Session
from datetime import datetime, timedelta

init_db()
with Session(engine) as session:
    if not session.exec(Grant.select()).first():
        grant = Grant(title='Community Grant', description='Support local projects', amount=10000, deadline=datetime.utcnow()+timedelta(days=30), eligibility='NPO')
        session.add(grant)
        session.commit()

