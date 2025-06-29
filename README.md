# FundingPro

FundingPro is a SaaS platform that helps organizations discover grants, draft applications with AI assistance, and track submissions. The project ships with a FastAPI backend secured with JWT, a Next.js frontend styled with Tailwind CSS, and a PostgreSQL database. Billing via Stripe and AI drafting via OpenAI are supported.

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

Copy `.env.example` to `.env` and fill in the values. Set `OPENAI_API_KEY` for AI drafting and `STRIPE_SECRET_KEY`/`STRIPE_PRICE_ID` for billing.

### Running manually (development)
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
```

### Seeding Sample Data
```bash
cd backend
python seed.py
```

### Tests
#### Backend
```bash
cd backend
PYTHONPATH=. pytest -q
```
#### Frontend
```bash
cd frontend
npm test
```

### Production build
Build the Docker images for deployment:
```bash
docker-compose build
```
Run the containers in detached mode with your production `.env`:
```bash
docker-compose up -d
```

### API Docs
Once running, visit `http://localhost:8000/docs` for interactive API documentation.

Demo credentials can be created with `python backend/seed.py`.
