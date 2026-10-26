from flask import Blueprint, request, jsonify, g
from app.models import db, Meeting, MeetingParticipant, User, CalendarEvent
from app.utils.auth import jwt_required
from app.services.audit_service import log_audit
from datetime import datetime, timedelta
import secrets

meeting_bp = Blueprint("meetings", __name__, url_prefix="/api")

@meeting_bp.route("/meetings", methods=["GET"])
@jwt_required
def list_meetings():
    org_id = g.current_org_id
    project_id = request.args.get("project_id")

    query = Meeting.query
    if org_id:
        query = query.filter_by(organization_id=org_id)
    if project_id:
        query = query.filter_by(project_id=project_id)

    meetings = query.order_by(Meeting.scheduled_start.desc()).all()
    return jsonify({"meetings": [m.to_dict() for m in meetings]})

@meeting_bp.route("/meetings/<string:code_or_id>", methods=["GET"])
@jwt_required
def get_meeting(code_or_id):
    if code_or_id.isdigit():
        meeting = Meeting.query.get(int(code_or_id))
    else:
        meeting = Meeting.query.filter_by(room_code=code_or_id).first()

    if not meeting:
        return jsonify({"error": "Meeting not found"}), 404

    return jsonify({"meeting": meeting.to_dict()})

@meeting_bp.route("/meetings", methods=["POST"])
@jwt_required
def create_meeting():
    data = request.get_json() or {}
    title = data.get("title", "").strip()

    if not title:
        return jsonify({"error": "Meeting title is required"}), 400

    now = datetime.utcnow()
    scheduled_start = now
    scheduled_end = now + timedelta(hours=1)

    if data.get("scheduled_start"):
        try:
            scheduled_start = datetime.fromisoformat(data["scheduled_start"].replace("Z", "+00:00"))
        except:
            pass

    if data.get("scheduled_end"):
        try:
            scheduled_end = datetime.fromisoformat(data["scheduled_end"].replace("Z", "+00:00"))
        except:
            pass

    # Generate unique 9-char alphanumeric room code e.g. "apex-meet-xyz"
    room_code = f"room-{secrets.token_hex(4)}"

    meeting = Meeting(
        organization_id=g.current_org_id,
        project_id=data.get("project_id"),
        title=title,
        description=data.get("description", ""),
        scheduled_start=scheduled_start,
        scheduled_end=scheduled_end,
        status="scheduled",
        room_code=room_code,
        host_id=g.current_user.id
    )
    db.session.add(meeting)
    db.session.flush()

    # Add host as participant
    host_part = MeetingParticipant(meeting_id=meeting.id, user_id=g.current_user.id, role="host", status="accepted")
    db.session.add(host_part)

    # Add invited participants
    participants = data.get("participants", [])
    for uid in participants:
        if uid != g.current_user.id:
            part = MeetingParticipant(meeting_id=meeting.id, user_id=uid, role="attendee", status="tentative")
            db.session.add(part)

    # Also automatically add to calendar
    cal_event = CalendarEvent(
        organization_id=g.current_org_id,
        user_id=g.current_user.id,
        project_id=data.get("project_id"),
        title=f"Meeting: {title}",
        description=f"Room Code: {room_code}",
        start_time=scheduled_start,
        end_time=scheduled_end,
        event_type="meeting"
    )
    db.session.add(cal_event)

    db.session.commit()
    log_audit("meeting_created", "Meeting", meeting.id, {"title": meeting.title, "room_code": room_code})
    return jsonify({"message": "Meeting created", "meeting": meeting.to_dict()}), 201

@meeting_bp.route("/meetings/<int:meeting_id>/status", methods=["PUT"])
@jwt_required
def update_meeting_status(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    data = request.get_json() or {}
    new_status = data.get("status")

    if new_status in ["scheduled", "active", "completed", "cancelled"]:
        meeting.status = new_status
        db.session.commit()
        return jsonify({"message": "Meeting status updated", "meeting": meeting.to_dict()})

    return jsonify({"error": "Invalid meeting status"}), 400
