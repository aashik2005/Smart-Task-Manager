# Smart Task Manager

A full-stack task management web application with JWT authentication, CRUD operations, a real-time dashboard, and automated email/WhatsApp reminders.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, Axios |
| Backend | FastAPI, SQLAlchemy ORM, Alembic |
| Database | PostgreSQL |
| Auth | JWT (python-jose + passlib/bcrypt) |
| Notifications | APScheduler, Gmail SMTP, Twilio WhatsApp Sandbox |

---

## Project Structure

```
Smart-Task-Manager/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app + CORS + lifespan (scheduler)
│   │   ├── database.py       # SQLAlchemy engine + session
│   │   ├── models.py         # User & Task ORM models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── auth.py           # JWT helpers + get_current_user dependency
│   │   ├── utils.py          # Email & WhatsApp send helpers
│   │   ├── routes/
│   │   │   ├── auth.py       # /api/auth/* endpoints
│   │   │   └── tasks.py      # /api/tasks/* endpoints
│   │   └── services/
│   │       └── scheduler.py  # APScheduler job definition
│   ├── alembic/              # Database migrations
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components (Dashboard, Tasks, Settings, Auth)
│   │   ├── services/         # API service modules
│   │   ├── hooks/            # useAuth hook
│   │   ├── types/            # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Quick Start (Local Development)

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ running locally

### 1. Clone and set up the backend

```bash
# Create and activate virtual environment
cd backend
python -m venv .venv
source .venv/bin/activate       # Linux/macOS
.venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your values (see Configuration section below)
```

### 2. Set up the database

```bash
# Create the PostgreSQL database
psql -U postgres -c "CREATE DATABASE task_manager;"

# Run Alembic migrations
alembic upgrade head
```

### 3. Start the backend

```bash
uvicorn app.main:app --reload
```

Backend will be available at **http://localhost:8000**
Interactive API docs at **http://localhost:8000/docs**

### 4. Set up and start the frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend will be available at **http://localhost:5173**

---

## Configuration (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/task_manager

# JWT
SECRET_KEY=your-super-secret-jwt-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440   # 24 hours

# Gmail (for email reminders)
# Use a Gmail App Password — NOT your regular password
# Enable 2FA on your Gmail account, then generate an App Password at:
# https://myaccount.google.com/apppasswords
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Twilio WhatsApp Sandbox (for WhatsApp reminders)
# Create a free account at https://www.twilio.com
# Activate the WhatsApp Sandbox in Console > Messaging > Try it Out > Send a WhatsApp message
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

> **Note:** If email/WhatsApp credentials are not configured, the scheduler will still run but skip notifications and log a warning instead of crashing.

---

## Docker Compose (One-command start)

```bash
# Copy and edit the backend env file first
cp backend/.env.example backend/.env

# Start all services (PostgreSQL + Backend + Frontend)
docker-compose up --build

# Run migrations inside the container
docker-compose exec backend alembic upgrade head
```

Services:
- Frontend → http://localhost:5173
- Backend API → http://localhost:8000
- PostgreSQL → localhost:5432

---

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current user profile |
| PATCH | `/api/auth/me` | Update profile + notification settings |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/` | List tasks (supports `search`, `status`, `priority` filters) |
| POST | `/api/tasks/` | Create a task |
| GET | `/api/tasks/dashboard` | Get dashboard statistics |
| GET | `/api/tasks/{id}` | Get a single task |
| PUT | `/api/tasks/{id}` | Update a task |
| PATCH | `/api/tasks/{id}/complete` | Mark a task as completed |
| DELETE | `/api/tasks/{id}` | Delete a task |

---

## Features

- **Authentication** — Register, Login, Logout with JWT tokens stored in `localStorage`
- **Task CRUD** — Create, read, update, delete tasks with title, description, priority, status, and due date
- **Dashboard** — Cards showing Total, Pending, In-Progress, Completed, and Overdue task counts
- **Search & Filters** — Real-time search with debounce; filter by status and priority
- **Notifications** — APScheduler checks every 15 minutes and sends reminders 24h before and on the due date
- **Responsive UI** — Mobile-friendly layout with Tailwind CSS
- **Form Validation** — Client-side and server-side validation with clear error messages

---

## WhatsApp Setup (Twilio Sandbox)

1. Sign up at https://www.twilio.com (free trial available)
2. Go to **Console > Messaging > Try it Out > Send a WhatsApp message**
3. Follow the instructions to join the sandbox (send a WhatsApp message to the Twilio number)
4. Add your credentials to `.env`
5. Users must also join your sandbox by sending the join code to the Twilio WhatsApp number

---

## Development Notes

- The backend auto-creates tables via `Base.metadata.create_all()` on startup (in addition to Alembic migrations)
- APScheduler runs in-process with `BackgroundScheduler` — no separate worker needed
- The Vite dev server proxies `/api/*` to `http://localhost:8000` — no CORS issues during development
