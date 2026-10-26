from flask import Blueprint, request, jsonify, g
from app.models import db, Task, Subtask, Project, User, Notification
from app.utils.auth import jwt_required
from app.services.audit_service import log_audit
from datetime import datetime

task_bp = Blueprint("tasks", __name__, url_prefix="/api")

@task_bp.route("/tasks", methods=["GET"])
@jwt_required
def list_tasks():
    project_id = request.args.get("project_id")
    assignee_id = request.args.get("assignee_id")
    status = request.args.get("status")

    query = Task.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    if assignee_id:
        query = query.filter_by(assignee_id=assignee_id)
    if status:
        query = query.filter_by(status=status)

    tasks = query.order_by(Task.order_index.asc(), Task.created_at.desc()).all()
    return jsonify({"tasks": [t.to_dict() for t in tasks]})

@task_bp.route("/tasks/<int:task_id>", methods=["GET"])
@jwt_required
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    return jsonify({"task": task.to_dict()})

@task_bp.route("/tasks", methods=["POST"])
@jwt_required
def create_task():
    data = request.get_json() or {}
    project_id = data.get("project_id")
    title = data.get("title", "").strip()

    if not project_id or not title:
        return jsonify({"error": "Project ID and Title are required"}), 400

    due_date = None
    if data.get("due_date"):
        try:
            due_date = datetime.strptime(data["due_date"][:10], "%Y-%m-%d").date()
        except:
            pass

    assignee_id = data.get("assignee_id")
    task = Task(
        project_id=project_id,
        milestone_id=data.get("milestone_id"),
        title=title,
        description=data.get("description", ""),
        status=data.get("status", "todo"),
        priority=data.get("priority", "medium"),
        creator_id=g.current_user.id,
        assignee_id=assignee_id,
        due_date=due_date,
        estimated_hours=float(data.get("estimated_hours", 0)),
        order_index=int(data.get("order_index", 0))
    )
    db.session.add(task)
    db.session.flush()

    # Add notification if assigned to another user
    if assignee_id and assignee_id != g.current_user.id:
        notif = Notification(
            user_id=assignee_id,
            title="New Task Assigned",
            message=f"{g.current_user.full_name} assigned you the task: '{title}'",
            notification_type="task_assigned",
            link_url=f"/projects/{project_id}?task={task.id}"
        )
        db.session.add(notif)

    db.session.commit()
    log_audit("task_created", "Task", task.id, {"title": task.title, "project_id": task.project_id})
    return jsonify({"message": "Task created", "task": task.to_dict()}), 201

@task_bp.route("/tasks/<int:task_id>/status", methods=["PUT"])
@jwt_required
def update_task_status(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json() or {}
    new_status = data.get("status")
    order_index = data.get("order_index")

    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    old_status = task.status
    task.status = new_status
    if order_index is not None:
        task.order_index = int(order_index)

    db.session.commit()
    log_audit("task_status_changed", "Task", task.id, {"old_status": old_status, "new_status": new_status})
    return jsonify({"message": "Task status updated", "task": task.to_dict()})

@task_bp.route("/tasks/<int:task_id>", methods=["PUT"])
@jwt_required
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json() or {}

    if "title" in data:
        task.title = data["title"].strip()
    if "description" in data:
        task.description = data["description"]
    if "status" in data:
        task.status = data["status"]
    if "priority" in data:
        task.priority = data["priority"]
    if "assignee_id" in data:
        task.assignee_id = data["assignee_id"]
    if "milestone_id" in data:
        task.milestone_id = data["milestone_id"]
    if "estimated_hours" in data:
        task.estimated_hours = float(data["estimated_hours"])
    if "actual_hours" in data:
        task.actual_hours = float(data["actual_hours"])
    if "due_date" in data:
        try:
            task.due_date = datetime.strptime(data["due_date"][:10], "%Y-%m-%d").date() if data["due_date"] else None
        except:
            pass

    db.session.commit()
    return jsonify({"message": "Task updated", "task": task.to_dict()})

@task_bp.route("/tasks/<int:task_id>/subtasks", methods=["POST"])
@jwt_required
def add_subtask(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Subtask title is required"}), 400

    subtask = Subtask(task_id=task.id, title=title, is_completed=False)
    db.session.add(subtask)
    db.session.commit()
    return jsonify({"message": "Subtask added", "subtask": subtask.to_dict()}), 201

@task_bp.route("/subtasks/<int:subtask_id>", methods=["PUT"])
@jwt_required
def update_subtask(subtask_id):
    subtask = Subtask.query.get_or_404(subtask_id)
    data = request.get_json() or {}
    if "is_completed" in data:
        subtask.is_completed = bool(data["is_completed"])
    if "title" in data:
        subtask.title = data["title"].strip()
    db.session.commit()
    return jsonify({"message": "Subtask updated", "subtask": subtask.to_dict()})
