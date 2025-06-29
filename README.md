# FundingPro

FundingPro is a SaaS platform that helps organizations discover grants, draft applications with AI assistance, and track submissions.

## Structure
- `backend/` – FastAPI application with a PostgreSQL database.
- `frontend/` – Next.js application styled with Tailwind CSS.
- `docker-compose.yml` – development environment with Postgres, backend, and frontend.
- `.env.example` – sample environment variables.

## Getting Started

### Prerequisites
- Python 3.11
- Node.js 18+
- Docker (optional but recommended)

### Running with Docker Compose
```bash
cp .env.example .env
docker-compose up --build
```
The backend will be available at `http://localhost:8000` and the frontend at `http://localhost:3000`.

### Running manually
#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn fundingpro.main:app --reload
```
#### Frontend
```bash
cd frontend
npm install
npm run dev

### Seeding Sample Data
```bash
cd backend
python seed.py
```

### Tests
#### Backend
```bash
cd backend
pytest
```
#### Frontend
```bash
cd frontend
npm test
```

This codebase is a starting point and does not include all production-ready features but demonstrates the main architecture.

### Building production images
```bash
docker-compose build
```
