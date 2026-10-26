# Apex Corporate Workspace

> A unified, secure, full-stack corporate collaboration platform inspired by **Microsoft Teams** and **Docker's developer-oriented workflows**. Combines team communication, Kanban project execution, WebRTC video conferencing, collaborative whiteboards, developer container telemetry, sandboxed diagnostic tools, and administrative governance.

---

## 🌟 Key Highlights & Modules

- **Unified Corporate Workspace:** Structured hierarchy: `Organization` → `Departments` → `Teams` → `Projects` → `Tasks`.
- **Microsoft Teams & Docker Aesthetic:** Deep slate modern dark theme (`#0b0f19`), indigo accents (`#6366f1`), and Docker cyan highlights (`#06b6d4`), responsive sidebar rail, top search bar, and live activity feeds.
- **Projects & Kanban Execution:** Drag-and-drop 5-stage Kanban board (**To Do**, **In Progress**, **In Review**, **Blocked**, **Completed**), structured List view, milestone tracking, subtask checklists, and calculated progress metrics.
- **Real-Time Communication (Socket.IO):** Discussion channels (`#general`, `#engineering-core`, `#project-collab`), live message streaming without page refreshes, typing indicators, and threaded persistence in MySQL.
- **WebRTC Video Conferencing:** Functional peer-to-peer audio/video conferencing, active camera preview, microphone mute toggle, screen sharing, in-call chat room, and room code sharing.
- **Collaborative Whiteboard:** Multi-tool HTML5 canvas with freehand pen, geometric shapes (rectangle, circle, arrow), sticky notes, text labels, undo, clear board, PNG export, and real-time Socket.IO synchronization.
- **Developer Hub & Docker Telemetry:** Microservice container status (running/stopped), port mappings, CPU/RAM telemetry, repo branches, and actions (`start`, `stop`, `restart`, `rebuild`).
- **Sandboxed Diagnostic Terminal:** Strictly controlled, whitelisted diagnostic tool runner (`git status`, `git log`, `node --version`, `python --version`, `docker compose ps`, `system_info`) with execution timeouts, sanitization, and immutable database audit logs.
- **Personal Planner & Calendar:** Monthly calendar aggregating deadlines, meetings, and milestones; personal to-do list with priority badges and completion checkboxes.
- **File Management:** Secure uploads and downloads with file size/extension validation and metadata tracking.
- **Executive Analytics:** Dynamic velocity calculations, workload balancing, and CSV export.
- **Administrative Governance (RBAC):** Role assignment (Platform Admin, Org Admin, Manager, Team Lead, Member, Guest), account suspension/reactivation, and security audit log table with IP tracking.

---

## 🚀 Quick Start (Local Development)

### 1. Start the Backend API Server
```bash
cd backend
python -m pip install -r requirements.txt
python seed_data.py   # Populates enterprise demo data and creates all tables
python run.py         # Starts Flask + SocketIO on http://127.0.0.1:5000
```

### 2. Start the Frontend Application
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** (or **http://localhost:3001**).

---

## 🔑 Demo User Accounts & 1-Click Role Switcher

The application features a **1-Click Test Switcher** on the login modal and in the top header bar, allowing you to instantly test any role:

| Role | Email Address | Password | Permissions Scope |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `admin@apexcorp.internal` | `Admin@12345` | Global admin, system diagnostics, user governance, audit trail |
| **Org Admin** | `alex.chen@apexcorp.internal` | `Admin@12345` | VP of Engineering, organization settings, project management |
| **Manager** | `sarah.jenkins@apexcorp.internal` | `Admin@12345` | Director of Product, sprint approvals, progress reports |
| **Team Leader** | `marcus.vance@apexcorp.internal` | `Admin@12345` | DevOps Lead, task assignment, whiteboard coordination |
| **Senior Engineer** | `elena.rostova@apexcorp.internal` | `Admin@12345` | Full-stack contributor, task updates, live channels, code tools |
| **Guest Collaborator** | `guest.partner@apexcorp.internal` | `Admin@12345` | Read-only / limited shared resource access |

---

## 🐳 Docker Compose Deployment

To deploy the entire production stack (MySQL 8.0, Flask WSGI backend, and Nginx React frontend):

```bash
docker compose up -d --build
```
- **Frontend & Nginx Reverse Proxy:** `http://localhost:3000`
- **Backend API & WebSockets:** `http://localhost:5000`
- **MySQL 8.0 Database:** `localhost:3306`

To populate seed data inside the container:
```bash
docker compose exec backend python seed_data.py
```

---

## 🧪 Automated Testing

Run the pytest suite to verify all endpoints, database transactions, and authorization rules:
```bash
cd backend
python -m pytest tests/test_api.py
```
*(Result: 3 passed in 2.91s)*

---

## 📁 Repository Structure

```
Devworkspace/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Flask app factory, SocketIO, CORS, Blueprints
│   │   ├── config.py             # MySQL, SQLite fallback, JWT secrets
│   │   ├── models/               # SQLAlchemy models (User, Org, Team, Project, Task, Channel, etc.)
│   │   ├── routes/               # Modular API routes (auth, orgs, projects, tasks, chat, dev, etc.)
│   │   ├── services/             # Real-time Socket.IO events, Audit logger
│   │   └── utils/                # JWT authentication decorators & helpers
│   ├── tests/                    # Pytest test suite (test_api.py)
│   ├── uploads/                  # Secure file upload directory
│   ├── Dockerfile                # Production Python 3.11 container manifest
│   ├── init_db.sql               # MySQL 8.0 schema DDL
│   ├── requirements.txt          # Backend dependencies
│   ├── run.py                    # Server entrypoint
│   └── seed_data.py              # Enterprise seed data generator
├── frontend/
│   ├── src/
│   │   ├── components/           # View components (Dashboard, Projects, Chat, Meetings, Whiteboard, Dev, Admin)
│   │   ├── context/              # AuthContext with 1-click test logins
│   │   ├── services/             # API client & Socket.IO singleton
│   │   ├── types/                # Complete TypeScript domain interfaces
│   │   ├── App.tsx               # Workspace shell & layout coordinator
│   │   └── index.css             # Teams & Docker styling design system
│   ├── Dockerfile                # Multi-stage production Nginx container manifest
│   ├── package.json              # React 18, Vite, Lucide icons, Socket.IO client
│   └── vite.config.ts            # Vite proxy configuration
├── docker-compose.yml            # Complete multi-container orchestration
├── .env.example                  # Environment variables template
├── API_DOCS.md                   # Complete REST & WebSocket API specification
├── ARCHITECTURE.md               # Technical architecture & hierarchy breakdown
├── DEPLOYMENT.md                 # Production deployment & rollback guide
├── BACKUP_RESTORE.md             # MySQL backup & recovery procedures
└── FEATURE_STATUS.md             # Module-by-module implementation report
```
