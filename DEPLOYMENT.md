# Apex Corporate Workspace - Deployment Guide

## 1. Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js v18+ & npm
- (Optional) Docker & Docker Compose

### Step 1: Initialize Database & Seed Data
```bash
cd backend
python -m pip install -r requirements.txt
python seed_data.py
```

### Step 2: Run Backend Server
```bash
python run.py
# Runs Flask + SocketIO on http://127.0.0.1:5000
```

### Step 3: Run Frontend
```bash
cd ../frontend
npm install
npm run dev
# Vite runs on http://localhost:3000 (or http://localhost:3001)
```

### Default Demo Credentials
- **Platform Admin:** `admin@apexcorp.internal` / `Admin@12345`
- **Org Admin:** `alex.chen@apexcorp.internal` / `Admin@12345`
- **Manager:** `sarah.jenkins@apexcorp.internal` / `Admin@12345`
- **Team Lead:** `marcus.vance@apexcorp.internal` / `Admin@12345`
- **Senior Dev:** `elena.rostova@apexcorp.internal` / `Admin@12345`
*(Or click any of the 1-click test buttons on the login modal!)*

---

## 2. Production Docker Deployment

### Step 1: Configure Environment Variables
Copy `.env.example` to `.env` and configure production secrets:
```bash
cp .env.example .env
```
Ensure strong random values are generated for `SECRET_KEY`, `JWT_SECRET_KEY`, and `MYSQL_PASSWORD`.

### Step 2: Launch All Services with Docker Compose
```bash
docker compose up -d --build
```
This starts 3 containerized services:
1. `apex-mysql`: MySQL 8.0 with persistent volume `mysql_data` and auto-initialized schema.
2. `apex-backend`: Gunicorn/Flask WSGI application with Socket.IO on port 5000.
3. `apex-frontend`: Nginx Alpine serving optimized React production bundle on port 3000 with reverse proxy for `/api` and `/socket.io`.

### Step 3: Populate Seed Data (First Run)
```bash
docker compose exec backend python seed_data.py
```

### Step 4: Verify Health
```bash
curl http://localhost:5000/api/health
```

---

## 3. Reverse Proxy & HTTPS Configuration (Nginx / Let's Encrypt)

For public production deployment, place an edge reverse proxy (such as Nginx or Traefik) terminating TLS with Let's Encrypt:

```nginx
server {
    listen 443 ssl http2;
    server_name workspace.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/workspace.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/workspace.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 4. Updates & Rollback Procedure

### Zero-Downtime Rolling Update
```bash
git pull origin main
docker compose build backend frontend
docker compose up -d --no-deps backend frontend
```

### Rollback Procedure
If a regression occurs:
```bash
git checkout <previous_stable_commit_tag>
docker compose build backend frontend
docker compose up -d --no-deps backend frontend
```
*(If database migrations were executed, restore from the latest snapshot using `BACKUP_RESTORE.md` instructions).*
