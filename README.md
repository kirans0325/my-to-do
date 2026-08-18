# TaskFlow Pro 🚀

> **Cross-Platform Task, Reminder, Progress Monitor & Daily Activity Journal System**  
> Runs simultaneously on **Android Mobile** and **Web Browsers** (React Native / Expo) powered by a **FastAPI** backend with seamless dual-database support (**SQLite** local & **Neon PostgreSQL** cloud).  
> 🔗 **GitHub Repository**: [https://github.com/kirans0325/my-to-do.git](https://github.com/kirans0325/my-to-do.git)

---

## 🌟 Key Features

1. **Flexible Reminders & Tasks**:
   - **Daily Habits & Routines** (e.g. daily exercise, standups, hydration).
   - **Monthly Deadlines & Bills** (e.g. server backups, rent, credit card billing).
   - **Yearly Milestones & Renewals** (e.g. vehicle insurance, annual taxes).
   - **One-Time Action Items**.
   - Subtasks & milestone checklists with automatic ratio-based progress calculation.

2. **⚡ Overdue Detection & Alert Center**:
   - Real-time overdue detector runs in the background.
   - High-visibility banner on the Dashboard when action is required.
   - Alert center with single-click "Mark Done" or "Acknowledge Alert" actions.

3. **📊 Progress Monitor & Streak Tracker**:
   - 0–100% progress tracking with steppers (`-10%`, `+10%`, `Complete`).
   - Active daily streak counter (🔥) to encourage consistency.
   - Visual analytics across Daily vs Monthly vs Yearly frequencies and categories.

4. **📔 Daily Diary & Activity Journal**:
   - Log daily thoughts, accomplishments, challenges, and ideas.
   - Mood rating (🤩 Great, 😊 Good, 😐 Neutral, 🥱 Tired, 🤯 Stressed).
   - Productivity score (1–10).
   - Daily activity timeline with timestamps and completion status.
   - Saved directly to your database (SQLite or Neon PostgreSQL).

5. **💾 Dual-Database Architecture**:
   - **Local SQLite** (`sqlite+aiosqlite:///./local_tasks.db`): Zero setup needed for offline/local development.
   - **Neon Cloud PostgreSQL** (`postgresql+asyncpg://...`): Switch to serverless cloud database with one environment variable change.

---

## 📁 Project Structure

```text
my-todo/
├── backend/                         # FastAPI Python Backend
│   ├── app/
│   │   ├── api/v1/endpoints/        # REST API Routes
│   │   │   ├── tasks.py             # CRUD, recurrence advancement, progress
│   │   │   ├── categories.py        # Categories management
│   │   │   ├── reminders.py         # Overdue & upcoming alert scanner
│   │   │   ├── diary.py             # Daily diary & activity log
│   │   │   └── stats.py             # Overview metrics & streaks
│   │   ├── core/
│   │   │   ├── config.py            # SQLite vs Neon Postgres switch
│   │   │   ├── database.py          # SQLAlchemy 2.0 async engine
│   │   │   └── scheduler.py         # Background periodic alert worker
│   │   ├── models/                  # SQLAlchemy ORM Models
│   │   │   ├── category.py
│   │   │   ├── task.py
│   │   │   ├── reminder.py
│   │   │   ├── progress.py
│   │   │   └── diary.py
│   │   ├── schemas/                 # Pydantic Schemas
│   │   │   ├── category_schema.py
│   │   │   ├── task_schema.py
│   │   │   ├── reminder_schema.py
│   │   │   ├── diary_schema.py
│   │   │   └── stats_schema.py
│   │   ├── services/                # Business logic
│   │   │   ├── recurrence_service.py # Next due date & cycle advancement
│   │   │   ├── alert_service.py      # Overdue scan & log emitter
│   │   │   └── stats_service.py      # Progress & streak calculation
│   │   └── main.py                  # Application entrypoint & CORS
│   ├── .env                         # Active configuration
│   ├── .env.example                 # Configuration template
│   ├── seed.py                      # Initial sample data seed script
│   ├── test_api.py                  # Automated integration test suite
│   └── requirements.txt             # Python dependencies
│
├── frontend/                        # React Native (Expo) Mobile & Web App
│   ├── src/
│   │   ├── api/                     # Axios API Client & Services
│   │   │   ├── client.ts
│   │   │   ├── taskApi.ts
│   │   │   ├── diaryApi.ts
│   │   │   └── statsApi.ts
│   │   ├── components/              # Modular UI Components
│   │   │   ├── Header.tsx           # Brand bar with streak & alert bell
│   │   │   ├── Navigation.tsx       # Bottom/Top responsive nav
│   │   │   ├── OverdueBanner.tsx    # High-visibility overdue alert
│   │   │   ├── TaskCard.tsx         # Task item with progress steppers
│   │   │   ├── DiaryCard.tsx        # Journal entry & activity timeline
│   │   │   ├── StatCard.tsx         # Progress metric card
│   │   │   ├── CreateTaskModal.tsx  # Task & reminder creation modal
│   │   │   └── CreateDiaryModal.tsx # Daily journal creation modal
│   │   ├── screens/                 # Mobile & Web Views
│   │   │   ├── DashboardScreen.tsx  # Today's overview & quick stats
│   │   │   ├── TasksScreen.tsx      # Daily/Monthly/Yearly filterable list
│   │   │   ├── DiaryScreen.tsx      # Daily activity journal history
│   │   │   ├── AlertsScreen.tsx     # Overdue & reminder notification center
│   │   │   └── AnalyticsScreen.tsx  # Charts and breakdown metrics
│   │   ├── state/
│   │   │   └── useAppStore.ts       # Zustand reactive store
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   └── utils/
│   │       ├── dateUtils.ts         # Overdue and date helpers
│   │       └── theme.ts             # Color palette & styling constants
│   ├── App.tsx                      # Root App component
│   ├── app.json                     # Expo configuration
│   ├── package.json                 # Frontend dependencies
│   └── tsconfig.json
│
└── README.md
```

---

## 🚀 Quick Start Guide

### Step 1: Start Backend (FastAPI)

1. Open a terminal in `my-todo/backend`:
   ```bash
   cd backend
   ```

2. Activate virtual environment:
   - **Windows PowerShell**:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - **Linux / Mac**:
     ```bash
     source .venv/bin/activate
     ```

3. (Optional) Populate sample data:
   ```bash
   python seed.py
   ```

4. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - **API Docs**: Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.

---

### Step 2: Start Frontend (Web & Mobile)

1. Open a second terminal in `my-todo/frontend`:
   ```bash
   cd frontend
   ```

2. Start the Expo development server:
   - **To run in Web Browser**:
     ```bash
     npm run web
     ```
     Open [http://localhost:8081](http://localhost:8081) in your browser.
   - **To run on Android Mobile**:
     ```bash
     npm run android
     ```
     *(Or run `npx expo start` and scan the QR code using the **Expo Go** app on your Android device).*

---

## ☁️ Switching to Neon PostgreSQL (Cloud Mode)

By default, the backend uses local SQLite (`local_tasks.db`). When you are ready to use Neon PostgreSQL:

1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech).
2. Copy your connection string from the Neon Console.
3. Open `backend/.env` and update `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql+asyncpg://neondb_owner:your_password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?ssl=require
   ```
4. Restart your FastAPI backend (`uvicorn app.main:app --reload --port 8000`).
   - The tables (`tasks`, `categories`, `diary_entries`, `reminder_logs`, `progress_entries`) will be automatically created on your Neon database!
   - You can run `python seed.py` to seed initial data into Neon.

---

## 🧪 Running Automated Tests

To run the backend integration test suite:
```bash
cd backend
python test_api.py
```
This tests:
- Health check
- Category and task CRUD
- Progress increments and subtask toggles
- Recurring task cycle advancement
- Daily Diary logging
- Overdue alert detection scanner
- Overview analytics calculations

---

## 🛠️ Manual Maintenance Guide

- **Adding a new task field**:
  1. Add column to `backend/app/models/task.py`.
  2. Update Pydantic schemas in `backend/app/schemas/task_schema.py`.
  3. Update TypeScript interface in `frontend/src/types/index.ts`.
  4. Update `CreateTaskModal.tsx` and `TaskCard.tsx` in frontend.

- **Adding a new Recurrence Frequency**:
  1. Add frequency name to `recurrence_type` in `backend/app/models/task.py` and `task_schema.py`.
  2. Add relative delta rule in `backend/app/services/recurrence_service.py`.
  3. Add tab and badge in `frontend/src/screens/TasksScreen.tsx` and `RecurrenceBadge`.

- **Adjusting Background Alert Frequency**:
  - Update `ALERT_CHECK_INTERVAL_SECONDS=60` in `backend/.env`.
