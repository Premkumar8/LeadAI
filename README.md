# Avanta — AI Sales CRM & Client Intelligence Platform

A full-stack B2B SaaS CRM with AI-powered lead scoring, outreach generation, meeting summarization, opportunity prediction, PDF proposal compilation, and a Credit & Debit finance ledger.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TailwindCSS v4, Recharts, Lucide Icons |
| **Backend** | FastAPI, SQLAlchemy, PostgreSQL, Scikit-Learn, ReportLab |
| **AI** | Google Gemini 2.5 Flash, BeautifulSoup4 |
| **Auth** | JWT (python-jose), Bcrypt |
| **Deploy** | Vercel (Frontend) + Railway / Render (Backend) + Neon / Supabase (Postgres) |

---

## 📂 Project Structure

```
LeadAI SaaS/
├── frontend/         # Next.js app (deploy to Vercel)
│   ├── src/app/      # Page routes (dashboard, leads, companies, finance, etc.)
│   ├── src/lib/api.ts # API client pointing to backend
│   └── .env.example  # Copy to .env.local for local dev
├── backend/          # FastAPI app (deploy to Railway/Render)
│   ├── app/
│   │   ├── api/v1/   # CRUD routers (leads, companies, transactions, etc.)
│   │   ├── models/   # SQLAlchemy DB models
│   │   ├── schemas/  # Pydantic validators
│   │   └── services/ # AI, predictor, crawler services
│   ├── main.py       # FastAPI entry point
│   ├── seed.py       # Demo data seeder
│   ├── clear_db.py   # Wipe DB + create admin
│   └── .env.example  # Copy to .env for local dev
└── docker-compose.yml # Local full-stack dev setup
```

---

## 🚀 Deployment Guide

### Step 1 — Deploy Backend (Railway recommended)

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. Select this repository → set **Root Directory** to `backend`
3. Set these **Environment Variables** in Railway dashboard:

```env
POSTGRES_SERVER=<your-neon-or-railway-postgres-host>
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<your_db_password>
POSTGRES_DB=avanta
POSTGRES_PORT=5432
SECRET_KEY=<generate-a-long-random-string>
GEMINI_API_KEY=<your-google-gemini-api-key>
```

4. Railway will auto-detect `main.py` and run:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. Note the **public URL** assigned by Railway (e.g. `https://avanta-backend.up.railway.app`)

#### Alternative: Render

1. New Web Service → connect repo → Root Directory: `backend`
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add the same environment variables above.

---

### Step 2 — Set Up Database (Neon recommended — free tier)

1. Go to [neon.tech](https://neon.tech) → Create project → Copy the **connection string**
2. Break it into Railway/Render env vars:
   - `POSTGRES_SERVER` = the hostname
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`
3. Tables are **auto-created on first startup** via SQLAlchemy `create_all()`

> **Note:** pgvector extension is optional — the app gracefully falls back if not available.

---

### Step 3 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project → Import from GitHub**
2. Set **Root Directory** to `frontend`
3. Framework Preset: **Next.js** (auto-detected)
4. Add this **Environment Variable** in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL = https://your-backend.up.railway.app/api/v1
```

5. Click **Deploy** — Vercel will run `npm run build` automatically.

---

### Step 4 — Create Admin Account

After deployment, the database is empty. Create your admin account via the **Register** page at your Vercel URL (`/register`), or use the pre-seeded credentials if you ran `seed.py`.

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL (local or Docker)

### Quick Start

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd "LeadAI SaaS"

# 2. Backend setup
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
cp .env.example .env        # Edit with your local Postgres credentials
python main.py              # Starts on http://localhost:8000

# 3. Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env.local  # Edit NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
npm run dev                 # Starts on http://localhost:3000
```

### Seed Demo Data

```bash
cd backend
venv\Scripts\activate
python seed.py      # Populates DB with companies, leads, tasks, transactions
```

### Clear All Data (Fresh Start)

```bash
cd backend
venv\Scripts\activate
python clear_db.py  # Wipes all data, creates admin@avanta.ai / password123
```

---

## 🔑 Default Login (after clear_db.py)

| Field | Value |
|-------|-------|
| Email | `admin@avanta.ai` |
| Password | `password123` |

> **Change this immediately in production!** Register a new account and delete the default.

---

## 📋 Features

- **Dashboard** — KPI metrics, revenue charts, pipeline health
- **Leads Pipeline** — Full CRUD for deals with stage tracking, AI outreach copywriting
- **Kanban Board** — Drag & drop deal stages
- **Companies** — Firmographic profiles, AI website crawler & scoring
- **Contacts** — Contact roster linked to companies
- **Meetings AI** — Meeting notes, transcript storage, AI summarizer + auto task generation
- **Action Tasks** — Task checklist linked to deals
- **AI Sales Assistant** — Chat assistant with full CRM context awareness
- **Credit & Debit** — Finance ledger with Credit/Debit tracking, Paid/Unpaid status, overdue notifications
- **Analytics & ML** — Scikit-Learn deal close predictor, PDF proposal generator
- **Light / Dark Mode** — Persistent theme toggle

---

## 🌐 Environment Variables Reference

### Frontend (`frontend/.env.local`)
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Full URL to FastAPI backend `/api/v1` | ✅ Yes |

### Backend (`backend/.env`)
| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_SERVER` | Database host | ✅ Yes |
| `POSTGRES_USER` | Database user | ✅ Yes |
| `POSTGRES_PASSWORD` | Database password | ✅ Yes |
| `POSTGRES_DB` | Database name | ✅ Yes |
| `POSTGRES_PORT` | Database port (default: 5432) | ✅ Yes |
| `SECRET_KEY` | JWT signing secret (change in prod!) | ✅ Yes |
| `GEMINI_API_KEY` | Google Gemini API key for AI features | ⚠️ Optional |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ⚠️ Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ⚠️ Optional |
