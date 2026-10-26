from datetime import datetime
import json
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Organization(db.Model):
    __tablename__ = "organizations"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(80), unique=True, nullable=False, index=True)
    domain = db.Column(db.String(120), nullable=True)
    logo_url = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    settings = db.Column(db.Text, default="{}")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    departments = db.relationship("Department", backref="organization", lazy="dynamic", cascade="all, delete-orphan")
    users = db.relationship("User", backref="organization", lazy="dynamic")
    projects = db.relationship("Project", backref="organization", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "domain": self.domain,
            "logo_url": self.logo_url,
            "description": self.description,
            "settings": json.loads(self.settings or "{}"),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Department(db.Model):
    __tablename__ = "departments"
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), nullable=True)
    description = db.Column(db.Text, nullable=True)
    manager_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    teams = db.relationship("Team", backref="department", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "name": self.name,
            "code": self.code,
            "description": self.description,
            "manager_id": self.manager_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Team(db.Model):
    __tablename__ = "teams"
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False, index=True)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    lead_id = db.Column(db.Integer, nullable=True)
    is_private = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    members = db.relationship("TeamMember", backref="team", lazy="dynamic", cascade="all, delete-orphan")
    projects = db.relationship("Project", backref="team", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "department_id": self.department_id,
            "name": self.name,
            "description": self.description,
            "lead_id": self.lead_id,
            "is_private": self.is_private,
            "member_count": self.members.count(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=True, index=True)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    avatar_url = db.Column(db.String(255), nullable=True)
    job_title = db.Column(db.String(100), default="Team Member")
    role = db.Column(db.String(50), default="member")  # platform_admin, org_admin, manager, team_lead, member, guest
    status = db.Column(db.String(20), default="active")  # active, suspended, pending
    phone = db.Column(db.String(30), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    timezone = db.Column(db.String(50), default="UTC")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_sensitive=False):
        data = {
            "id": self.id,
            "organization_id": self.organization_id,
            "department_id": self.department_id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "avatar_url": self.avatar_url,
            "job_title": self.job_title,
            "role": self.role,
            "status": self.status,
            "phone": self.phone,
            "bio": self.bio,
            "timezone": self.timezone,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        return data

class TeamMember(db.Model):
    __tablename__ = "team_members"
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    role_in_team = db.Column(db.String(30), default="contributor")  # leader, contributor, viewer
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="team_memberships")

    def to_dict(self):
        return {
            "id": self.id,
            "team_id": self.team_id,
            "user_id": self.user_id,
            "role_in_team": self.role_in_team,
            "user": self.user.to_dict() if self.user else None,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }

class Project(db.Model):
    __tablename__ = "projects"
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False, index=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=True, index=True)
    name = db.Column(db.String(120), nullable=False)
    key = db.Column(db.String(20), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default="active")  # planning, active, paused, completed, archived
    priority = db.Column(db.String(20), default="medium")  # low, medium, high, critical
    start_date = db.Column(db.Date, nullable=True)
    due_date = db.Column(db.Date, nullable=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = db.relationship("User", foreign_keys=[owner_id])
    milestones = db.relationship("Milestone", backref="project", lazy="dynamic", cascade="all, delete-orphan")
    tasks = db.relationship("Task", backref="project", lazy="dynamic", cascade="all, delete-orphan")

    def get_progress_metrics(self):
        all_tasks = self.tasks.all()
        total = len(all_tasks)
        if total == 0:
            return {"total": 0, "completed": 0, "in_progress": 0, "blocked": 0, "todo": 0, "review": 0, "progress_percent": 0.0, "overdue": 0}
        
        completed = sum(1 for t in all_tasks if t.status == "completed")
        in_progress = sum(1 for t in all_tasks if t.status == "in_progress")
        blocked = sum(1 for t in all_tasks if t.status == "blocked")
        todo = sum(1 for t in all_tasks if t.status == "todo")
        review = sum(1 for t in all_tasks if t.status == "review")
        
        now_date = datetime.utcnow().date()
        overdue = sum(1 for t in all_tasks if t.due_date and t.due_date < now_date and t.status != "completed")
        progress_pct = round((completed / total) * 100, 1)

        return {
            "total": total,
            "completed": completed,
            "in_progress": in_progress,
            "blocked": blocked,
            "todo": todo,
            "review": review,
            "overdue": overdue,
            "progress_percent": progress_pct,
        }

    def to_dict(self):
        metrics = self.get_progress_metrics()
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "team_id": self.team_id,
            "name": self.name,
            "key": self.key,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "owner_id": self.owner_id,
            "owner": self.owner.to_dict() if self.owner else None,
            "metrics": metrics,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Milestone(db.Model):
    __tablename__ = "milestones"
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False, index=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(30), default="open")  # open, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Task(db.Model):
    __tablename__ = "tasks"
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False, index=True)
    milestone_id = db.Column(db.Integer, db.ForeignKey("milestones.id"), nullable=True, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default="todo", index=True)  # todo, in_progress, review, blocked, completed
    priority = db.Column(db.String(20), default="medium")  # low, medium, high, critical
    creator_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    assignee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    due_date = db.Column(db.Date, nullable=True)
    estimated_hours = db.Column(db.Float, default=0.0)
    actual_hours = db.Column(db.Float, default=0.0)
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = db.relationship("User", foreign_keys=[creator_id])
    assignee = db.relationship("User", foreign_keys=[assignee_id])
    subtasks = db.relationship("Subtask", backref="task", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        subtasks_list = [s.to_dict() for s in self.subtasks.all()]
        return {
            "id": self.id,
            "project_id": self.project_id,
            "milestone_id": self.milestone_id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "creator_id": self.creator_id,
            "assignee_id": self.assignee_id,
            "creator": self.creator.to_dict() if self.creator else None,
            "assignee": self.assignee.to_dict() if self.assignee else None,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "estimated_hours": self.estimated_hours,
            "actual_hours": self.actual_hours,
            "order_index": self.order_index,
            "subtasks": subtasks_list,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class Subtask(db.Model):
    __tablename__ = "subtasks"
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "task_id": self.task_id,
            "title": self.title,
            "is_completed": self.is_completed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Channel(db.Model):
    __tablename__ = "channels"
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False, index=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=True, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=True, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_direct = db.Column(db.Boolean, default=False)
    is_private = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    messages = db.relationship("Message", backref="channel", lazy="dynamic", cascade="all, delete-orphan")
    members = db.relationship("ChannelMember", backref="channel", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        last_msg = self.messages.order_by(Message.id.desc()).first()
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "team_id": self.team_id,
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "is_direct": self.is_direct,
            "is_private": self.is_private,
            "created_by": self.created_by,
            "last_message": last_msg.to_dict() if last_msg else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class ChannelMember(db.Model):
    __tablename__ = "channel_members"
    id = db.Column(db.Integer, primary_key=True)
    channel_id = db.Column(db.Integer, db.ForeignKey("channels.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "channel_id": self.channel_id,
            "user_id": self.user_id,
            "user": self.user.to_dict() if self.user else None,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }

class Message(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True)
    channel_id = db.Column(db.Integer, db.ForeignKey("channels.id"), nullable=False, index=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    parent_id = db.Column(db.Integer, nullable=True, index=True)
    message_type = db.Column(db.String(30), default="text")  # text, file, system, code
    attachments = db.Column(db.Text, default="[]")  # JSON string
    is_edited = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sender = db.relationship("User")

    def to_dict(self):
        try:
            parsed_attachments = json.loads(self.attachments or "[]")
        except:
            parsed_attachments = []
        return {
            "id": self.id,
            "channel_id": self.channel_id,
            "sender_id": self.sender_id,
            "sender": self.sender.to_dict() if self.sender else None,
            "content": "[Message deleted]" if self.is_deleted else self.content,
            "parent_id": self.parent_id,
            "message_type": self.message_type,
            "attachments": parsed_attachments,
            "is_edited": self.is_edited,
            "is_deleted": self.is_deleted,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class Meeting(db.Model):
    __tablename__ = "meetings"
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=True, index=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    scheduled_start = db.Column(db.DateTime, nullable=False)
    scheduled_end = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(30), default="scheduled")  # scheduled, active, completed, cancelled
    room_code = db.Column(db.String(64), unique=True, nullable=False, index=True)
    host_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    host = db.relationship("User", foreign_keys=[host_id])
    participants = db.relationship("MeetingParticipant", backref="meeting", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "project_id": self.project_id,
            "title": self.title,
            "description": self.description,
            "scheduled_start": self.scheduled_start.isoformat() if self.scheduled_start else None,
            "scheduled_end": self.scheduled_end.isoformat() if self.scheduled_end else None,
            "status": self.status,
            "room_code": self.room_code,
            "host_id": self.host_id,
            "host": self.host.to_dict() if self.host else None,
            "participants": [p.to_dict() for p in self.participants.all()],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class MeetingParticipant(db.Model):
    __tablename__ = "meeting_participants"
    id = db.Column(db.Integer, primary_key=True)
    meeting_id = db.Column(db.Integer, db.ForeignKey("meetings.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    role = db.Column(db.String(30), default="attendee")  # host, presenter, attendee
    status = db.Column(db.String(30), default="accepted")  # accepted, tentative, declined
    joined_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_id": self.meeting_id,
            "user_id": self.user_id,
            "user": self.user.to_dict() if self.user else None,
            "role": self.role,
            "status": self.status,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }

class Whiteboard(db.Model):
    __tablename__ = "whiteboards"
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False, index=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=True, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=True, index=True)
    title = db.Column(db.String(150), nullable=False)
    board_data = db.Column(db.Text, default='{"elements":[],"version":1}')
    thumbnail_url = db.Column(db.String(255), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = db.relationship("User")

    def to_dict(self):
        try:
            data = json.loads(self.board_data or '{"elements":[]}')
        except:
            data = {"elements": []}
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "team_id": self.team_id,
            "project_id": self.project_id,
            "title": self.title,
            "board_data": data,
            "thumbnail_url": self.thumbnail_url,
            "created_by": self.created_by,
            "creator": self.creator.to_dict() if self.creator else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class CalendarEvent(db.Model):
    __tablename__ = "calendar_events"
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=True, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=True, index=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    event_type = db.Column(db.String(30), default="meeting")  # meeting, deadline, milestone, personal, reminder
    is_all_day = db.Column(db.Boolean, default=False)
    location = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "user_id": self.user_id,
            "team_id": self.team_id,
            "project_id": self.project_id,
            "title": self.title,
            "description": self.description,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "event_type": self.event_type,
            "is_all_day": self.is_all_day,
            "location": self.location,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class PersonalTask(db.Model):
    __tablename__ = "personal_tasks"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    priority = db.Column(db.String(20), default="medium")  # low, medium, high
    due_date = db.Column(db.Date, nullable=True)
    is_completed = db.Column(db.Boolean, default=False)
    project_task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "notes": self.notes,
            "priority": self.priority,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "is_completed": self.is_completed,
            "project_task_id": self.project_task_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class FileRecord(db.Model):
    __tablename__ = "file_records"
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=True, index=True)
    filename = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, default=0)
    mime_type = db.Column(db.String(100), default="application/octet-stream")
    storage_path = db.Column(db.String(500), nullable=False)
    folder_path = db.Column(db.String(255), default="/")
    is_public = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    uploader = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "user_id": self.user_id,
            "project_id": self.project_id,
            "filename": self.filename,
            "original_name": self.original_name,
            "file_size": self.file_size,
            "mime_type": self.mime_type,
            "folder_path": self.folder_path,
            "uploader": self.uploader.to_dict() if self.uploader else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), default="system")  # task_assigned, meeting_invite, mention, project_update, system
    link_url = db.Column(db.String(255), nullable=True)
    is_read = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "message": self.message,
            "notification_type": self.notification_type,
            "link_url": self.link_url,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class AuditLog(db.Model):
    __tablename__ = "audit_logs"
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    action = db.Column(db.String(100), nullable=False, index=True)
    target_type = db.Column(db.String(50), nullable=True)
    target_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.Text, default="{}")
    ip_address = db.Column(db.String(64), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    user = db.relationship("User")

    def to_dict(self):
        try:
            parsed = json.loads(self.details or "{}")
        except:
            parsed = {}
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else "System",
            "action": self.action,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "details": parsed,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class DevEnvironment(db.Model):
    __tablename__ = "dev_environments"
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=True, index=True)
    name = db.Column(db.String(100), nullable=False)
    service_type = db.Column(db.String(50), default="web")  # web, api, database, redis, worker
    status = db.Column(db.String(30), default="running")  # running, stopped, building, healthy, degraded
    port_mappings = db.Column(db.String(100), default="8080:80")
    image_tag = db.Column(db.String(100), default="alpine:latest")
    cpu_usage = db.Column(db.Float, default=1.2)
    memory_usage = db.Column(db.String(50), default="64MB / 512MB")
    repo_url = db.Column(db.String(255), nullable=True)
    branch = db.Column(db.String(100), default="main")
    last_commit = db.Column(db.String(100), default="feat: initial production workspace integration")
    last_deployed_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "service_type": self.service_type,
            "status": self.status,
            "port_mappings": self.port_mappings,
            "image_tag": self.image_tag,
            "cpu_usage": self.cpu_usage,
            "memory_usage": self.memory_usage,
            "repo_url": self.repo_url,
            "branch": self.branch,
            "last_commit": self.last_commit,
            "last_deployed_at": self.last_deployed_at.isoformat() if self.last_deployed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
