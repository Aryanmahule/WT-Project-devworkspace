from flask import Blueprint, request, jsonify, g
from app.models import db, CalendarEvent, Task, Meeting
from app.utils.auth import jwt_required
from datetime import datetime

calendar_bp = Blueprint("calendar", __name__, url_prefix="/api/calendar")

@calendar_bp.route("/events", methods=["GET"])
@jwt_required
def get_events():
    org_id = g.current_org_id
    project_id = request.args.get("project_id")
    team_id = request.args.get("team_id")

    query = CalendarEvent.query
    if org_id:
        query = query.filter_by(organization_id=org_id)
    if project_id:
        query = query.filter_by(project_id=project_id)
    if team_id:
        query = query.filter_by(team_id=team_id)

    events = query.order_by(CalendarEvent.start_time.asc()).all()
    events_data = [e.to_dict() for e in events]

    # Also include task due dates as calendar deadline events if relevant
    task_query = Task.query.filter(Task.due_date.isnot(None))
    if project_id:
        task_query = task_query.filter_by(project_id=project_id)
    tasks_with_deadlines = task_query.all()

    for t in tasks_with_deadlines:
        events_data.append({
            "id": f"task-{t.id}",
            "title": f"Due: {t.title}",
            "description": f"Status: {t.status}, Priority: {t.priority}",
            "start_time": f"{t.due_date}T09:00:00",
            "end_time": f"{t.due_date}T18:00:00",
            "event_type": "deadline",
            "is_all_day": True,
            "project_id": t.project_id
        })

    return jsonify({"events": events_data})

@calendar_bp.route("/events", methods=["POST"])
@jwt_required
def create_event():
    data = request.get_json() or {}
    title = data.get("title", "").strip()

    if not title or not data.get("start_time") or not data.get("end_time"):
        return jsonify({"error": "Title, start_time, and end_time are required"}), 400

    start_time = datetime.fromisoformat(data["start_time"].replace("Z", "+00:00"))
    end_time = datetime.fromisoformat(data["end_time"].replace("Z", "+00:00"))

    event = CalendarEvent(
        organization_id=g.current_org_id,
        user_id=g.current_user.id,
        project_id=data.get("project_id"),
        team_id=data.get("team_id"),
        title=title,
        description=data.get("description", ""),
        start_time=start_time,
        end_time=end_time,
        event_type=data.get("event_type", "meeting"),
        is_all_day=data.get("is_all_day", False),
        location=data.get("location", "")
    )
    db.session.add(event)
    db.session.commit()
    return jsonify({"message": "Event created", "event": event.to_dict()}), 201

@calendar_bp.route("/events/<int:event_id>", methods=["DELETE"])
@jwt_required
def delete_event(event_id):
    event = CalendarEvent.query.get_or_404(event_id)
    if event.user_id != g.current_user.id and g.current_user.role not in ["platform_admin", "org_admin"]:
        return jsonify({"error": "Permission denied"}), 403

    db.session.delete(event)
    db.session.commit()
    return jsonify({"message": "Event deleted"})
