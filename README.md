# FundingPro (Skeleton)

This repository provides a minimal skeleton for the **FundingPro** SaaS platform. The platform aims to help organizations discover grants, draft applications with AI assistance, and track submissions.

## Structure

- `backend/` – FastAPI application exposing a simple `/grants` endpoint with sample data.
- `frontend/` – Next.js application with a basic landing page.

## Getting Started

### Backend
```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```
cd frontend
npm install
npm run dev
```

This code is only a starting point and does not include the full functionality described in the project scope.
