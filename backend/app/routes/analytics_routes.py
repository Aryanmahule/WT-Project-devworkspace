from flask import Blueprint, jsonify, g
from app.models import db, Project, Task, User, Team, Meeting, AuditLog
from app.utils.auth import jwt_required
from datetime import datetime, timedelta

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")

@analytics_bp.route("/dashboard", methods=["GET"])
@jwt_required
def get_dashboard_data():
    org_id = g.current_org_id

    # Projects
    projects_query = Project.query
    if org_id:
        projects_query = projects_query.filter_by(organization_id=org_id)
    projects = projects_query.all()

    total_projects = len(projects)
    active_projects = sum(1 for p in projects if p.status == "active")
    completed_projects = sum(1 for p in projects if p.status == "completed")

    # Tasks
    tasks_query = Task.query.join(Project)
    if org_id:
        tasks_query = tasks_query.filter(Project.organization_id == org_id)
    all_tasks = tasks_query.all()

    total_tasks = len(all_tasks)
    completed_tasks = sum(1 for t in all_tasks if t.status == "completed")
    in_progress_tasks = sum(1 for t in all_tasks if t.status == "in_progress")
    review_tasks = sum(1 for t in all_tasks if t.status == "review")
    blocked_tasks = sum(1 for t in all_tasks if t.status == "blocked")
    todo_tasks = sum(1 for t in all_tasks if t.status == "todo")

    now_date = datetime.utcnow().date()
    overdue_tasks = sum(1 for t in all_tasks if t.due_date and t.due_date < now_date and t.status != "completed")
    overall_progress = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    # User's assigned tasks
    user_tasks = [t.to_dict() for t in all_tasks if t.assignee_id == g.current_user.id and t.status != "completed"][:5]

    # Upcoming meetings (next 7 days)
    now_dt = datetime.utcnow()
    meetings_query = Meeting.query.filter(
        Meeting.scheduled_start >= now_dt,
        Meeting.status != "cancelled"
    )
    if org_id:
        meetings_query = meetings_query.filter_by(organization_id=org_id)
    upcoming_meetings = [m.to_dict() for m in meetings_query.order_by(Meeting.scheduled_start.asc()).limit(5).all()]

    # Workload distribution by user
    user_workload = {}
    for t in all_tasks:
        if t.assignee:
            uname = t.assignee.full_name
            user_workload[uname] = user_workload.get(uname, 0) + 1
    
    workload_chart = [{"user": k, "tasks": v} for k, v in list(user_workload.items())[:8]]

    # Recent activity from audit log
    audit_query = AuditLog.query
    if org_id:
        audit_query = audit_query.filter_by(organization_id=org_id)
    recent_activity = [a.to_dict() for a in audit_query.order_by(AuditLog.created_at.desc()).limit(10).all()]

    return jsonify({
        "metrics": {
            "total_projects": total_projects,
            "active_projects": active_projects,
            "completed_projects": completed_projects,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "in_progress_tasks": in_progress_tasks,
            "review_tasks": review_tasks,
            "blocked_tasks": blocked_tasks,
            "todo_tasks": todo_tasks,
            "overdue_tasks": overdue_tasks,
            "overall_progress": overall_progress
        },
        "user_tasks": user_tasks,
        "upcoming_meetings": upcoming_meetings,
        "workload_chart": workload_chart,
        "recent_activity": recent_activity
    })
