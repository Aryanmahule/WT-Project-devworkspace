# Apex Corporate Workspace - Architecture Documentation

## 1. System Architecture Overview

The Apex Corporate Workspace platform delivers a unified collaboration suite inspired by Microsoft Teams and Docker Desktop. It is built upon a full-stack, modular architecture designed for high availability, security, and developer productivity.

```
+-----------------------------------------------------------------------------------+
|                            Client Tier (Browser)                                  |
|  React 18 + TypeScript + Vite | Lucide Enterprise Icons | WebRTC | Socket.IO Client|
+-----------------------------------------+-----------------------------------------+
                                          |
                        HTTPS (REST)      |   WSS (WebSockets)
                                          v
+-----------------------------------------------------------------------------------+
|                        Application Tier (Python / Flask)                          |
|  - App Factory (create_app)                                                       |
|  - Flask-SocketIO (Event Mesh: Chat, WebRTC Signaling, Whiteboard sync)           |
|  - JWT Authentication & RBAC Enforcer (@jwt_required, @roles_required)            |
|  - Audit Service (Immutable security log generator)                              |
|  - Sandboxed Diagnostic Runner (Bounded execution with telemetry)                 |
|  - Modular Blueprints: Auth, Orgs, Teams, Projects, Tasks, Meetings, Dev, Admin   |
+-----------------------------------------+-----------------------------------------+
                                          |
                               SQLAlchemy | PyMySQL Driver
                                          v
+-----------------------------------------------------------------------------------+
|                        Persistence Tier (MySQL 8.0)                               |
|  Organizations | Departments | Teams | Users | Projects | Tasks | Subtasks       |
|  Channels | Messages | Meetings | Whiteboards | Calendar | DevEnvironments        |
|  AuditLogs | Notifications | FileRecords                                          |
+-----------------------------------------------------------------------------------+
```

---

## 2. Domain & Organizational Hierarchy

The platform implements a strict multi-level corporate hierarchy:

$$\text{Organization} \longrightarrow \text{Departments} \longrightarrow \text{Teams} \longrightarrow \text{Projects} \longrightarrow \text{Tasks} \longrightarrow \text{Subtasks}$$

- **Organizations:** Apex Technologies Corp (Domain boundary, tenant isolation, global policy).
- **Departments:** Functional divisions (Core Engineering, Product & Design, Cloud & DevOps).
- **Teams:** Agile cross-functional pods (Platform Architecture, DevOps & Reliability, Web Experience).
- **Projects:** Initiatives with unique keys, due dates, milestones, and calculated velocity metrics.
- **Tasks & Subtasks:** Granular units of delivery with status, priority, time estimates, and checklists.

---

## 3. Role-Based Access Control (RBAC)

Authorization is verified server-side on every protected endpoint. Permissions are distinct from role identifiers:

| Role | Scope & Permissions | Typical Title |
| :--- | :--- | :--- |
| **Platform Administrator** | Full platform configuration, system diagnostics, global audit logs | Chief Systems Architect |
| **Organization Administrator**| Organization settings, user role assignment, account activation/suspension | VP of Engineering |
| **Manager** | Departmental oversight, team creation, project approval, progress reports | Director of Product Eng |
| **Team Leader** | Team activities, sprint planning, task assignments, whiteboard management | Staff Infrastructure Lead |
| **Team Member** | Task execution, channels discussion, meeting participation, code tooling | Senior Engineer |
| **Guest / Collaborator** | Read-only / limited interaction on explicitly shared project resources | External Consultant |

---

## 4. Real-Time Communication & WebRTC Mesh

1. **Persistent Chat:**
   - Client sends message via Socket.IO `send_message`.
   - Message is saved transactionally to the database with sender metadata and timestamps.
   - Message is broadcast to channel room `channel_<id>` for instant sub-millisecond updates across all connected clients.
   - Live `typing` events broadcast non-persistent indicators.
2. **WebRTC Video Conferencing:**
   - Flask-SocketIO acts as the peer signaling channel (`join_meeting`, `meeting_signal`).
   - Browser peers exchange SDP offers, answers, and ICE candidate packets over WebSocket.
   - Media (audio, video, screen share) flows directly between peers using hardware-accelerated WebRTC pipelines.
3. **Collaborative Whiteboard:**
   - Multi-tool HTML5 canvas capturing vector shapes, freehand strokes, and sticky notes.
   - Strokes and elements are broadcast across the `whiteboard_<id>` room in real time.
   - Complete element state is serialized and persisted to the database upon clicking "Save Board".

---

## 5. Developer Workspace & Sandboxed Diagnostics

Inspired by Docker workflows:
- **Service Containers:** Microservices cards (Web, API Gateway, Redis Cache, MySQL DB, Task Worker) display image tags, port mappings, real-time CPU/RAM telemetry, git commit metadata, and action controls (`start`, `stop`, `restart`, `rebuild`).
- **Sandboxed Tool Access:** Explicitly avoids arbitrary shell access. A strict whitelist (`git status`, `git log`, `python --version`, `node --version`, `project_tree`, `system_info`) executes through isolated child processes with a 5-second timeout, input sanitization, and automatic immutable logging to the `audit_logs` database table.
