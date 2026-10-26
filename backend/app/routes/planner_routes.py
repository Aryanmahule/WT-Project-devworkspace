from flask import Blueprint, request, jsonify, g
from app.models import db, PersonalTask
from app.utils.auth import jwt_required
from datetime import datetime

planner_bp = Blueprint("planner", __name__, url_prefix="/api/planner")

@planner_bp.route("/tasks", methods=["GET"])
@jwt_required
def list_personal_tasks():
    tasks = PersonalTask.query.filter_by(user_id=g.current_user.id).order_by(PersonalTask.created_at.desc()).all()
    return jsonify({"tasks": [t.to_dict() for t in tasks]})

@planner_bp.route("/tasks", methods=["POST"])
@jwt_required
def create_personal_task():
    data = request.get_json() or {}
    title = data.get("title", "").strip()

    if not title:
        return jsonify({"error": "Task title is required"}), 400

    due_date = None
    if data.get("due_date"):
        try:
            due_date = datetime.strptime(data["due_date"][:10], "%Y-%m-%d").date()
        except:
            pass

    task = PersonalTask(
        user_id=g.current_user.id,
        title=title,
        notes=data.get("notes", ""),
        priority=data.get("priority", "medium"),
        due_date=due_date,
        project_task_id=data.get("project_task_id")
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({"message": "Personal task created", "task": task.to_dict()}), 201

@planner_bp.route("/tasks/<int:task_id>", methods=["PUT"])
@jwt_required
def update_personal_task(task_id):
    task = PersonalTask.query.filter_by(id=task_id, user_id=g.current_user.id).first_or_404()
    data = request.get_json() or {}

    if "title" in data:
        task.title = data["title"].strip()
    if "notes" in data:
        task.notes = data["notes"]
    if "priority" in data:
        task.priority = data["priority"]
    if "is_completed" in data:
        task.is_completed = bool(data["is_completed"])
    if "due_date" in data:
        try:
            task.due_date = datetime.strptime(data["due_date"][:10], "%Y-%m-%d").date() if data["due_date"] else None
        except:
            pass

    db.session.commit()
    return jsonify({"message": "Personal task updated", "task": task.to_dict()})

@planner_bp.route("/tasks/<int:task_id>", methods=["DELETE"])
@jwt_required
def delete_personal_task(task_id):
    task = PersonalTask.query.filter_by(id=task_id, user_id=g.current_user.id).first_or_404()
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Personal task deleted"})
