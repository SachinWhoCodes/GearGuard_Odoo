# GearGuard Backend (FastAPI + PostgreSQL)

This backend is designed to power the GearGuard (Ultimate Maintenance Tracker) frontend:
- Auth (JWT)
- Users (roles)
- Teams (memberIds)
- Equipment (registry + scrapping)
- Maintenance Requests (kanban stages)
- Public equipment endpoint for QR scan page
- Optional QR image endpoint (PNG)

## Quick Start (Docker)

1) Copy env:
```bash
cp .env.example .env
```

2) Start:
```bash
docker compose up --build
```

API will be available at:
- http://localhost:8000
- Docs: http://localhost:8000/docs

## Local Start (without Docker)

1) Create venv and install deps:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2) Set env vars (or create `.env` and export):
```bash
export DATABASE_URL="postgresql+psycopg2://gearguard:gearguard@localhost:5432/gearguard"
export SECRET_KEY="change-me"
```

3) Run migrations:
```bash
alembic upgrade head
```

4) Start API:
```bash
uvicorn app.main:app --reload
```

## Frontend integration

Set in frontend `.env`:
```bash
VITE_API_URL=http://localhost:8000
```

Public scan endpoint used by ScanPage:
- `GET /api/v1/public/equipment/{equipmentId}`

Optional QR image endpoint (PNG):
- `GET /api/v1/public/equipment/{equipmentId}/qr?mode=link`
  - mode=link encodes `FRONTEND_BASE_URL/scan/{id}`
  - mode=json encodes `{"equipmentId":"..."}`
