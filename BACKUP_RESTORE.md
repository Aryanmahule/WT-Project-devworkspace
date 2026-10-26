# Apex Corporate Workspace - Database Backup & Restoration

## 1. Automated Daily Backup Script (Bash / Cron)

Save this script as `/opt/apex/scripts/backup_mysql.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/apex_mysql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/devplatform_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[*] Starting MySQL snapshot backup: ${BACKUP_FILE}"

# Execute mysqldump inside container or directly on host
docker exec apex-mysql mysqldump \
  -u apexuser -papexpassword \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  devplatform | gzip -9 > "${BACKUP_FILE}"

echo "[+] Backup successfully written: $(du -h "${BACKUP_FILE}" | cut -f1)"

# Keep last 14 days of backups
find "${BACKUP_DIR}" -type f -name "devplatform_backup_*.sql.gz" -mtime +14 -delete
echo "[+] Old backups pruned."
```

### Cron Schedule (Runs every night at 2:00 AM)
```cron
0 2 * * * /opt/apex/scripts/backup_mysql.sh >> /var/log/apex_backup.log 2>&1
```

---

## 2. Manual Backup Command
```bash
docker exec apex-mysql mysqldump -u apexuser -papexpassword --single-transaction devplatform > backup_manual.sql
```

---

## 3. Restoration Procedure

### Step 1: Ensure Backend is Paused (Prevent In-Flight Writes)
```bash
docker compose stop backend
```

### Step 2: Restore from SQL Backup
```bash
cat backup_manual.sql | docker exec -i apex-mysql mysql -u apexuser -papexpassword devplatform
```

### Step 3: Restart Application Services
```bash
docker compose start backend
```

### Step 4: Validate Restoration
```bash
curl http://localhost:5000/api/health
```
Check that the audit logs, task counts, and user memberships match expected snapshots.
