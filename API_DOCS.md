# Apex Corporate Workspace - API Documentation

## Authentication & Headers
All protected API endpoints require a valid JSON Web Token (JWT) provided in the HTTP `Authorization` header:
```http
Authorization: Bearer <jwt_access_token>
```

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/login`
Authenticates a user and returns a signed JWT token along with user profile metadata.
- **Request Body:**
```json
{
  "email_or_username": "admin@apexcorp.internal",
  "password": "Admin@12345"
}
```
- **Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@apexcorp.internal",
    "username": "sysadmin",
    "full_name": "Platform Administrator",
    "role": "platform_admin",
    "status": "active",
    "job_title": "Chief Systems Architect"
  }
}
```

### `POST /api/auth/register`
Creates a new organizational user account.
- **Request Body:**
```json
{
  "email": "developer@apexcorp.internal",
  "username": "devuser",
  "password": "Password123",
  "full_name": "Dev User",
  "job_title": "Software Engineer",
  "role": "member"
}
```
- **Response (201 Created):** Returns user object and auth token.

### `GET /api/auth/me`
Fetches the currently authenticated user profile and associated organization.
- **Response (200 OK):** Current user object with organization settings.

### `GET /api/auth/users`
Lists all members in the current organization.

---

## 2. Organization & Teams Endpoints (`/api`)

### `GET /api/orgs`
Returns list of organizations.

### `GET /api/departments`
Returns all organizational departments (Engineering, Product Design, Infrastructure).

### `GET /api/teams`
Lists all teams in the organization.

### `POST /api/teams`
Creates a new team.
- **Request Body:**
```json
{
  "name": "Distributed Systems",
  "department_id": 1,
  "description": "High-throughput services"
}
```

---

## 3. Projects & Milestones (`/api/projects`)

### `GET /api/projects`
Query parameters: `?team_id=<id>&status=<status>`
- **Response (200 OK):** Returns array of projects with calculated metrics:
```json
{
  "projects": [
    {
      "id": 1,
      "name": "NextGen Microservices Mesh",
      "key": "MESH",
      "status": "active",
      "priority": "critical",
      "metrics": {
        "total": 5,
        "completed": 2,
        "in_progress": 2,
        "blocked": 1,
        "todo": 0,
        "progress_percent": 40.0
      }
    }
  ]
}
```

### `POST /api/projects`
Creates a new project with required Key prefix and priority.

### `GET /api/projects/<id>`
Returns project details with milestones and team members.

---

## 4. Task Management & Kanban Board (`/api/tasks`)

### `GET /api/tasks`
Query parameters: `?project_id=<id>&status=<status>&assignee_id=<id>`

### `POST /api/tasks`
Creates a new project task.
- **Request Body:**
```json
{
  "project_id": 1,
  "title": "Configure WebSockets channel handlers",
  "description": "Real-time chat and whiteboard broadcast",
  "priority": "high",
  "assignee_id": 5,
  "due_date": "2026-11-05",
  "estimated_hours": 16.0
}
```

### `PUT /api/tasks/<id>/status`
Drag-and-drop or quick transition Kanban status update.
- **Request Body:**
```json
{
  "status": "in_progress",
  "order_index": 2
}
```

### `POST /api/tasks/<id>/subtasks`
Appends a checklist item to a task.

---

## 5. Real-Time Chat & Channels (`/api/channels`)

### `GET /api/channels`
Lists available public and member-accessible private channels.

### `POST /api/channels`
Creates a new discussion channel or direct message channel.

### `GET /api/channels/<id>/messages`
Returns persisted chat history for the channel.

### `POST /api/channels/<id>/messages`
Persists a new message in MySQL with optional attachments.

---

## 6. Video Meetings (`/api/meetings`)

### `GET /api/meetings`
Lists scheduled, active, and completed video conferences.

### `POST /api/meetings`
Schedules a video meeting and automatically generates a unique room code.
- **Response:**
```json
{
  "meeting": {
    "id": 1,
    "title": "Sprint Architecture Review",
    "room_code": "room-apex-sprint1",
    "status": "scheduled",
    "scheduled_start": "2026-10-26T11:00:00"
  }
}
```

---

## 7. Collaborative Whiteboard (`/api/whiteboards`)

### `GET /api/whiteboards`
Returns whiteboard metadata for projects or teams.

### `GET /api/whiteboards/<id>`
Loads stored element drawings, shapes, and sticky notes JSON.

### `PUT /api/whiteboards/<id>`
Saves updated canvas state into MySQL database.

---

## 8. Developer Workspace & Docker (`/api/dev`)

### `GET /api/dev/environments`
Lists microservice containers, CPU/RAM telemetry, ports, and commit data.

### `POST /api/dev/environments/<id>/action`
Executes action: `start`, `stop`, `restart`, `rebuild`.

### `POST /api/dev/terminal/run`
Executes a permission-controlled sandboxed tool with audit logging.
- **Request Body:**
```json
{
  "command_key": "git_status"
}
```
- **Allowed Keys:** `git_status`, `git_log`, `node_version`, `python_version`, `list_services`, `system_info`, `project_tree`.

---

## 9. Analytics & Reporting (`/api/analytics/dashboard`)

### `GET /api/analytics/dashboard`
Returns calculated metrics across all projects, workload balance, active tasks, upcoming meetings, and recent audit activity.

---

## 10. Admin & Audit Logs (`/api/admin`)

### `GET /api/admin/users`
Lists organizational users for role assignment and suspension management.

### `PUT /api/admin/users/<id>/status`
Updates user role (`platform_admin`, `org_admin`, `manager`, `team_lead`, `member`, `guest`) or status (`active`, `suspended`).

### `GET /api/admin/audit-logs`
Returns chronologically indexed security audit records.
