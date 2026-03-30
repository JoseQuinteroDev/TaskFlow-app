# TaskFlow

TaskFlow is a full-stack task management application with Kanban workflow, JWT cookie authentication, reminders, categories, and productivity stats. It is production-ready for a modern split deployment: **React (Vercel)** + **FastAPI (Railway)** + **MongoDB Atlas**.

## Live Deployment

- **Frontend (Vercel):** configure from `frontend/`
- **Backend (Railway):** configure from `backend/`
- **Database (MongoDB Atlas):** shared managed cluster

> Add your URLs after deployment:
>
> - Frontend: `https://your-frontend.vercel.app`
> - Backend: `https://your-backend.railway.app`

---

## Tech Stack

### Frontend
- React (Create React App + CRACO)
- React Router
- Axios
- Tailwind CSS + shadcn/ui components

### Backend
- FastAPI
- MongoDB (Motor async driver)
- JWT auth (HttpOnly cookies)
- APScheduler (task reminders)
- SendGrid (email reminders)

### Infrastructure
- Vercel (frontend hosting)
- Railway (backend hosting)
- MongoDB Atlas (database)

---

## Core Features

- User registration and login
- JWT-based authentication with HttpOnly cookies
- Kanban task management (Todo / In Progress / Done)
- Task filters (search, priority, category)
- Category management
- Task stats dashboard (completion rate, overdue, due today)
- Optional email reminders for tasks

---

## Architecture Overview

```text
frontend/ (React SPA)
  └── src/api/*                 # Centralized API client/services

backend/ (FastAPI app)
  └── app/
      ├── api/routes/*          # Route modules by domain
      ├── core/*                # Config, security, database
      ├── models/schemas.py     # Pydantic schemas
      └── services/*            # Email + reminder services
```

---

## Environment Variables

### Backend (`backend/.env`)

Required for production:

- `ENVIRONMENT=production`
- `MONGO_URL` (MongoDB Atlas connection string)
- `DB_NAME`
- `JWT_SECRET` (at least 32 chars in production)
- `FRONTEND_URL` (deployed Vercel URL)
- `CORS_ORIGINS` (comma-separated allowed origins)
- `SENDGRID_API_KEY` (optional, required for reminders by email)
- `SENDER_EMAIL` (verified sender)
- `COOKIE_SECURE` (optional override)
- `COOKIE_SAMESITE` (optional override: `lax|strict|none`)

See `backend/.env.example`.

### Frontend (`frontend/.env`)

- `REACT_APP_BACKEND_URL` (your Railway backend URL)

See `frontend/.env.example`.

---

## Local Development Setup

## 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Update `.env` values, then run:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 2) Frontend

```bash
cd frontend
cp .env.example .env
# set REACT_APP_BACKEND_URL=http://localhost:8000
npm install
npm start
```

Frontend runs at `http://localhost:3000`.

---

## Production Deployment Guide

## A) MongoDB Atlas

1. Create a cluster and database user.
2. Allow network access from Railway (or `0.0.0.0/0` with strong credentials).
3. Copy connection URI into `MONGO_URL`.

## B) Railway (Backend)

1. Create a new Railway project from this repository.
2. Set **Root Directory** to `backend`.
3. Add environment variables from `backend/.env.example`.
4. Railway start command (already provided in `backend/Procfile` / `backend/railway.json`):
   - `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`
5. Deploy and copy your public backend URL.

## C) Vercel (Frontend)

1. Create project from the same repository.
2. Set **Root Directory** to `frontend`.
3. Configure env var:
   - `REACT_APP_BACKEND_URL=https://your-backend.railway.app`
4. Build command: `npm run build`
5. Output directory: `build`
6. Deploy.

`frontend/vercel.json` includes SPA rewrite fallback so routes like `/dashboard` work on refresh.

---

## Security Notes

- Auth tokens are stored in **HttpOnly cookies**.
- In production, cookie defaults are hardened:
  - `Secure=True`
  - `SameSite=None` (cross-domain frontend/backend compatibility)
- CORS is controlled via `CORS_ORIGINS`.
- `JWT_SECRET` is mandatory and validated in production.

---

## Project Structure

```text
TaskFlow-app/
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   ├── core/
│   │   ├── models/
│   │   └── services/
│   ├── Procfile
│   ├── railway.json
│   ├── requirements.txt
│   └── requirements-dev.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   └── vercel.json
└── README.md
```

---

## Screenshots

> Pending screenshots for portfolio:
>
> - Login page
> - Dashboard overview
> - Kanban board with drag-and-drop
> - Task modal

---

## Future Improvements

- Add automated backend and frontend CI pipelines.
- Add unit/integration tests for FastAPI routes and services.
- Add refresh token rotation and revocation list.
- Add rate limiting and audit logs.
- Add OpenAPI auth examples and API docs screenshots.

---

## License

MIT (recommended for portfolio/open-source usage).
