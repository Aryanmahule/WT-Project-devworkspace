import os
import json
from datetime import datetime, timedelta, date
from app import create_app
from app.models import (
    db, Organization, Department, Team, TeamMember, User,
    Project, Milestone, Task, Subtask, Channel, ChannelMember,
    Message, Meeting, MeetingParticipant, Whiteboard, CalendarEvent,
    PersonalTask, Notification, AuditLog, DevEnvironment
)

app = create_app(os.getenv("FLASK_ENV", "development"))

def seed_database():
    with app.app_context():
        print("[*] Creating database tables...")
        db.create_all()

        if Organization.query.first():
            print("[*] Database already populated with seed data. Skipping.")
            return

        print("[*] Populating initial enterprise demo data...")

        # 1. Organization
        org = Organization(
            name="Apex Technologies Corp",
            slug="apex-tech",
            domain="apexcorp.internal",
            logo_url="https://images.unsplash.com/photo-1551434678-e076c223a692?w=128&q=80",
            description="Enterprise Cloud Collaboration & Distributed Developer Workspaces",
            settings=json.dumps({
                "theme": "dark",
                "mfa_enforced": False,
                "allow_guest_invites": True,
                "max_upload_size_mb": 50
            })
        )
        db.session.add(org)
        db.session.flush()

        # 2. Departments
        dept_eng = Department(organization_id=org.id, name="Core Engineering", code="ENG", description="Backend platforms, APIs, distributed systems")
        dept_prod = Department(organization_id=org.id, name="Product & Design", code="PRD", description="UI/UX design, design systems, user experience")
        dept_infra = Department(organization_id=org.id, name="Cloud & DevOps", code="OPS", description="Kubernetes clusters, CI/CD, telemetry")
        db.session.add_all([dept_eng, dept_prod, dept_infra])
        db.session.flush()

        # 3. Users with various roles
        users_data = [
            ("admin@apexcorp.internal", "sysadmin", "Platform Administrator", "platform_admin", "Chief Systems Architect", dept_eng.id),
            ("alex.chen@apexcorp.internal", "alexchen", "Alex Chen", "org_admin", "VP of Engineering", dept_eng.id),
            ("sarah.jenkins@apexcorp.internal", "sarahj", "Sarah Jenkins", "manager", "Director of Product Engineering", dept_prod.id),
            ("marcus.vance@apexcorp.internal", "marcusv", "Marcus Vance", "team_lead", "Staff Infrastructure Lead", dept_infra.id),
            ("elena.rostova@apexcorp.internal", "elenar", "Elena Rostova", "member", "Senior Full-Stack Engineer", dept_eng.id),
            ("david.kim@apexcorp.internal", "davidk", "David Kim", "member", "Senior DevOps Engineer", dept_infra.id),
            ("guest.partner@apexcorp.internal", "guestuser", "Jordan Taylor", "guest", "External Consultant", None),
        ]

        created_users = {}
        for email, uname, fname, role, title, dept_id in users_data:
            u = User(
                organization_id=org.id,
                department_id=dept_id,
                username=uname,
                email=email,
                full_name=fname,
                job_title=title,
                role=role,
                status="active",
                bio=f"{title} at Apex Technologies Corp. Passionate about developer workflows and scalable architecture."
            )
            u.set_password("Admin@12345")
            db.session.add(u)
            db.session.flush()
            created_users[uname] = u

        # 4. Teams
        team_platform = Team(organization_id=org.id, department_id=dept_eng.id, name="Platform Architecture", description="Core distributed services and APIs", lead_id=created_users["alexchen"].id)
        team_devops = Team(organization_id=org.id, department_id=dept_infra.id, name="DevOps & Reliability", description="Infrastructure, Docker automation, and telemetry", lead_id=created_users["marcusv"].id)
        team_frontend = Team(organization_id=org.id, department_id=dept_prod.id, name="Web & Experience", description="Frontend systems, Whiteboard, and real-time collaboration", lead_id=created_users["sarahj"].id)
        db.session.add_all([team_platform, team_devops, team_frontend])
        db.session.flush()

        # Team Memberships
        for team, members in [
            (team_platform, [("alexchen", "leader"), ("elenar", "contributor"), ("sysadmin", "viewer")]),
            (team_devops, [("marcusv", "leader"), ("davidk", "contributor"), ("sysadmin", "viewer")]),
            (team_frontend, [("sarahj", "leader"), ("elenar", "contributor"), ("guestuser", "viewer")])
        ]:
            for uname, role_in_team in members:
                tm = TeamMember(team_id=team.id, user_id=created_users[uname].id, role_in_team=role_in_team)
                db.session.add(tm)

        # 5. Projects
        p1 = Project(
            organization_id=org.id,
            team_id=team_platform.id,
            name="NextGen Microservices Mesh",
            key="MESH",
            description="Zero-trust high throughput RPC mesh with integrated health telemetry and circuit breaking.",
            status="active",
            priority="critical",
            start_date=date.today() - timedelta(days=20),
            due_date=date.today() + timedelta(days=45),
            owner_id=created_users["alexchen"].id
        )
        p2 = Project(
            organization_id=org.id,
            team_id=team_frontend.id,
            name="Corporate Collaboration Suite",
            key="COLLAB",
            description="Unified Microsoft Teams & Docker-inspired collaboration hub with WebRTC meetings & collaborative canvas.",
            status="active",
            priority="high",
            start_date=date.today() - timedelta(days=15),
            due_date=date.today() + timedelta(days=30),
            owner_id=created_users["sarahj"].id
        )
        p3 = Project(
            organization_id=org.id,
            team_id=team_devops.id,
            name="Cloud Sandbox Execution Engine",
            key="SAND",
            description="Secure Docker container isolation runtime for developer testing with granular audit logging.",
            status="active",
            priority="medium",
            start_date=date.today() - timedelta(days=10),
            due_date=date.today() + timedelta(days=60),
            owner_id=created_users["marcusv"].id
        )
        db.session.add_all([p1, p2, p3])
        db.session.flush()

        # 6. Milestones
        m1 = Milestone(project_id=p2.id, title="Sprint 1 - Foundation & Realtime Core", description="Auth, WebSocket signaling, and Kanban engine", due_date=date.today() + timedelta(days=5), status="open")
        m2 = Milestone(project_id=p2.id, title="Sprint 2 - WebRTC Video & Whiteboard", description="Peer-to-peer conferencing and drawing canvas", due_date=date.today() + timedelta(days=18), status="open")
        db.session.add_all([m1, m2])
        db.session.flush()

        # 7. Tasks
        tasks_data = [
            (p2.id, m1.id, "Design high-fidelity Teams & Docker dark theme", "todo", "high", "sarahj", "elenar", date.today() + timedelta(days=3), 16.0),
            (p2.id, m1.id, "Implement WebSockets & live channels messaging", "in_progress", "critical", "alexchen", "elenar", date.today() + timedelta(days=2), 24.0),
            (p2.id, m1.id, "Configure MySQL database schemas and migrations", "completed", "critical", "sysadmin", "davidk", date.today() - timedelta(days=2), 12.0),
            (p2.id, m2.id, "Build WebRTC peer connection signaling engine", "in_progress", "high", "marcusv", "davidk", date.today() + timedelta(days=6), 20.0),
            (p2.id, m2.id, "Implement collaborative whiteboard with shapes & notes", "todo", "medium", "sarahj", "elenar", date.today() + timedelta(days=10), 30.0),
            (p1.id, None, "Benchmark gRPC latency under 10k concurrent streams", "blocked", "high", "alexchen", "davidk", date.today() - timedelta(days=1), 18.0),
            (p1.id, None, "Automate mTLS certificate rotation for worker nodes", "completed", "critical", "marcusv", "sysadmin", date.today() - timedelta(days=5), 14.0),
            (p3.id, None, "Enforce CPU and Memory limits via cgroups in Docker runner", "review", "medium", "marcusv", "davidk", date.today() + timedelta(days=4), 16.0)
        ]

        created_tasks = []
        for pid, mid, title, status, prio, c_uname, a_uname, ddate, est_h in tasks_data:
            t = Task(
                project_id=pid,
                milestone_id=mid,
                title=title,
                description=f"Detailed specifications and validation criteria for {title}.",
                status=status,
                priority=prio,
                creator_id=created_users[c_uname].id,
                assignee_id=created_users[a_uname].id,
                due_date=ddate,
                estimated_hours=est_h,
                actual_hours=est_h * 0.6 if status in ["completed", "in_progress"] else 0.0
            )
            db.session.add(t)
            created_tasks.append(t)
        db.session.flush()

        # Subtasks for Task 1
        st1 = Subtask(task_id=created_tasks[0].id, title="Color palette tokens and CSS variables", is_completed=True)
        st2 = Subtask(task_id=created_tasks[0].id, title="Sidebar collapsible navigation bar", is_completed=True)
        st3 = Subtask(task_id=created_tasks[0].id, title="Responsive mobile header & drawer menu", is_completed=False)
        db.session.add_all([st1, st2, st3])

        # 8. Channels & Messages
        ch_gen = Channel(organization_id=org.id, name="general", description="Company-wide announcements and informal chat", created_by=created_users["sysadmin"].id)
        ch_eng = Channel(organization_id=org.id, team_id=team_platform.id, name="engineering-core", description="Architecture discussions, code reviews, and deployments", created_by=created_users["alexchen"].id)
        ch_collab = Channel(organization_id=org.id, project_id=p2.id, name="project-collab", description="Collaboration platform sprint updates and blockers", created_by=created_users["sarahj"].id)
        db.session.add_all([ch_gen, ch_eng, ch_collab])
        db.session.flush()

        # Channel Memberships
        for ch in [ch_gen, ch_eng, ch_collab]:
            for u in created_users.values():
                db.session.add(ChannelMember(channel_id=ch.id, user_id=u.id))

        # Initial Messages
        msgs = [
            (ch_gen.id, "sysadmin", "Welcome everyone to the Apex Technologies Unified Collaboration Workspace! 🚀"),
            (ch_gen.id, "alexchen", "Glad to see the platform online. All engineering teams have access to project boards and Docker workspace tooling."),
            (ch_eng.id, "marcusv", "We have configured the container runner with strict cgroups memory bounds. Audit logging is active on all endpoints."),
            (ch_eng.id, "davidk", "Checked the database migration scripts for MySQL 8.0 compatibility. Everything validated cleanly."),
            (ch_collab.id, "sarahj", "Sprint 1 Kanban board is ready. Elena, please check the WebSockets integration task."),
            (ch_collab.id, "elenar", "On it! WebSockets events for channels, whiteboard sync, and WebRTC signaling are tested and responding.")
        ]
        for ch_id, sender_uname, content in msgs:
            m = Message(channel_id=ch_id, sender_id=created_users[sender_uname].id, content=content)
            db.session.add(m)

        # 9. Video Meetings
        m_now = datetime.utcnow()
        meeting1 = Meeting(
            organization_id=org.id,
            project_id=p2.id,
            title="Sprint 1 Architecture & Video Conference Sync",
            description="Demonstration of peer-to-peer WebRTC video conferencing, screen sharing, and meeting chat.",
            scheduled_start=m_now + timedelta(hours=1),
            scheduled_end=m_now + timedelta(hours=2),
            status="scheduled",
            room_code="room-apex-sprint1",
            host_id=created_users["sarahj"].id
        )
        meeting2 = Meeting(
            organization_id=org.id,
            project_id=p1.id,
            title="Mesh Resilience & Failover Drill",
            description="Live chaos drill testing container failovers and telemetry alerts.",
            scheduled_start=m_now + timedelta(days=2),
            scheduled_end=m_now + timedelta(days=2, hours=1),
            status="scheduled",
            room_code="room-mesh-chaos",
            host_id=created_users["marcusv"].id
        )
        db.session.add_all([meeting1, meeting2])
        db.session.flush()

        # 10. Collaborative Whiteboard
        initial_board_elements = {
            "version": 1,
            "elements": [
                {"id": "note-1", "type": "sticky", "x": 100, "y": 80, "width": 180, "height": 140, "color": "#fef08a", "text": "🎯 Core Goal:\nSingle platform for Teams + Docker dev workflows."},
                {"id": "rect-1", "type": "rect", "x": 340, "y": 80, "width": 160, "height": 90, "color": "#38bdf8", "text": "API Gateway\n(Flask + SocketIO)"},
                {"id": "rect-2", "type": "rect", "x": 560, "y": 80, "width": 160, "height": 90, "color": "#818cf8", "text": "MySQL 8.0\n(SQLAlchemy ORM)"},
                {"id": "arrow-1", "type": "arrow", "fromX": 500, "fromY": 125, "toX": 560, "toY": 125, "color": "#94a3b8"},
                {"id": "rect-3", "type": "rect", "x": 340, "y": 230, "width": 160, "height": 90, "color": "#34d399", "text": "WebRTC Mesh\nSignaling Server"},
                {"id": "note-2", "type": "sticky", "x": 560, "y": 230, "width": 180, "height": 140, "color": "#fed7aa", "text": "🔒 Security First:\n• Audit logs\n• JWT auth\n• Sandboxed runner"}
            ]
        }
        wb = Whiteboard(
            organization_id=org.id,
            project_id=p2.id,
            title="Platform Architecture & Microservice Topology",
            board_data=json.dumps(initial_board_elements),
            created_by=created_users["alexchen"].id
        )
        db.session.add(wb)

        # 11. Calendar Events
        cal1 = CalendarEvent(
            organization_id=org.id,
            user_id=created_users["sarahj"].id,
            project_id=p2.id,
            title="Sprint 1 Architecture Sync",
            description="Room: room-apex-sprint1",
            start_time=m_now + timedelta(hours=1),
            end_time=m_now + timedelta(hours=2),
            event_type="meeting",
            location="Virtual Room #room-apex-sprint1"
        )
        cal2 = CalendarEvent(
            organization_id=org.id,
            user_id=created_users["alexchen"].id,
            project_id=p1.id,
            title="NextGen Mesh Q4 Milestone Review",
            description="Executive review of deployment velocity",
            start_time=m_now + timedelta(days=3, hours=4),
            end_time=m_now + timedelta(days=3, hours=5),
            event_type="milestone",
            location="Apex Boardroom & Virtual"
        )
        db.session.add_all([cal1, cal2])

        # 12. Personal Tasks for admin
        pt1 = PersonalTask(user_id=created_users["sysadmin"].id, title="Review SSL cipher suites in production Nginx template", priority="high", due_date=date.today() + timedelta(days=1), is_completed=False)
        pt2 = PersonalTask(user_id=created_users["sysadmin"].id, title="Verify automated MySQL backup cron schedule", priority="medium", due_date=date.today() + timedelta(days=3), is_completed=True)
        pt3 = PersonalTask(user_id=created_users["sysadmin"].id, title="Update team documentation for WebRTC signaling setup", priority="low", due_date=date.today() + timedelta(days=5), is_completed=False)
        db.session.add_all([pt1, pt2, pt3])

        # 13. Dev Environments (Docker-inspired workspace services)
        dev_envs = [
            DevEnvironment(project_id=p2.id, name="frontend-web-service", service_type="web", status="running", port_mappings="3000:3000", image_tag="node:20-alpine", cpu_usage=1.4, memory_usage="142MB / 1024MB", repo_url="https://github.com/apexcorp/web-collab", branch="main", last_commit="feat: high-fidelity Teams & Docker styling"),
            DevEnvironment(project_id=p2.id, name="backend-api-gateway", service_type="api", status="running", port_mappings="5000:5000", image_tag="python:3.11-slim", cpu_usage=2.1, memory_usage="186MB / 1024MB", repo_url="https://github.com/apexcorp/api-gateway", branch="main", last_commit="feat: implement WebSockets & live channels messaging"),
            DevEnvironment(project_id=p1.id, name="redis-telemetry-cache", service_type="redis", status="running", port_mappings="6379:6379", image_tag="redis:7-alpine", cpu_usage=0.4, memory_usage="45MB / 512MB", repo_url="https://github.com/apexcorp/cache", branch="main", last_commit="chore: tune redis LRU eviction policy"),
            DevEnvironment(project_id=p1.id, name="mysql-primary-db", service_type="database", status="running", port_mappings="3306:3306", image_tag="mysql:8.0", cpu_usage=1.8, memory_usage="320MB / 2048MB", repo_url="https://github.com/apexcorp/db", branch="main", last_commit="feat: schema migrations v1.4.0"),
            DevEnvironment(project_id=p3.id, name="sandbox-task-worker", service_type="worker", status="running", port_mappings="8080:8080", image_tag="apexcorp/sandbox-runner:v2", cpu_usage=0.8, memory_usage="94MB / 1024MB", repo_url="https://github.com/apexcorp/runner", branch="main", last_commit="feat: cgroups resource bounds")
        ]
        db.session.add_all(dev_envs)

        # 14. Notifications for admin
        n1 = Notification(user_id=created_users["sysadmin"].id, title="Platform Ready", message="All database schemas initialized. Welcome to Apex Collaboration Platform.", notification_type="system", link_url="/dashboard", is_read=False)
        n2 = Notification(user_id=created_users["sysadmin"].id, title="Upcoming Architecture Meeting", message="Sarah Jenkins scheduled 'Sprint 1 Architecture Sync' in 1 hour.", notification_type="meeting_invite", link_url="/meetings", is_read=False)
        db.session.add_all([n1, n2])

        # 15. Audit Logs
        al1 = AuditLog(organization_id=org.id, user_id=created_users["sysadmin"].id, action="system_initialized", target_type="System", target_id=1, details=json.dumps({"version": "1.0.0", "env": "development"}), ip_address="127.0.0.1")
        al2 = AuditLog(organization_id=org.id, user_id=created_users["alexchen"].id, action="project_created", target_type="Project", target_id=p1.id, details=json.dumps({"key": "MESH"}), ip_address="127.0.0.1")
        db.session.add_all([al1, al2])

        db.session.commit()
        print("[+] Seed database populated successfully!")
        print("    Demo User Accounts:")
        print("    - Platform Admin: admin@apexcorp.internal / Admin@12345")
        print("    - Org Admin:      alex.chen@apexcorp.internal / Admin@12345")
        print("    - Manager:        sarah.jenkins@apexcorp.internal / Admin@12345")
        print("    - Team Lead:      marcus.vance@apexcorp.internal / Admin@12345")
        print("    - Member:         elena.rostova@apexcorp.internal / Admin@12345")
        print("    - Member (DevOps):david.kim@apexcorp.internal / Admin@12345")
        print("    - Guest:          guest.partner@apexcorp.internal / Admin@12345")

if __name__ == "__main__":
    seed_database()
