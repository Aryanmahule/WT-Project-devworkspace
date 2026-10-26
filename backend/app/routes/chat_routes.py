from flask import Blueprint, request, jsonify, g
from app.models import db, Channel, ChannelMember, Message, User
from app.utils.auth import jwt_required
from app.services.audit_service import log_audit
import json

chat_bp = Blueprint("chat", __name__, url_prefix="/api")

@chat_bp.route("/channels", methods=["GET"])
@jwt_required
def list_channels():
    org_id = g.current_org_id
    team_id = request.args.get("team_id")

    query = Channel.query
    if org_id:
        query = query.filter_by(organization_id=org_id)
    if team_id:
        query = query.filter_by(team_id=team_id)

    channels = query.all()
    return jsonify({"channels": [c.to_dict() for c in channels]})

@chat_bp.route("/channels", methods=["POST"])
@jwt_required
def create_channel():
    data = request.get_json() or {}
    name = data.get("name", "").strip().lower().replace(" ", "-")
    description = data.get("description", "")
    team_id = data.get("team_id")
    project_id = data.get("project_id")
    is_private = data.get("is_private", False)
    is_direct = data.get("is_direct", False)

    if not name:
        return jsonify({"error": "Channel name is required"}), 400

    channel = Channel(
        organization_id=g.current_org_id,
        team_id=team_id,
        project_id=project_id,
        name=name,
        description=description,
        is_private=is_private,
        is_direct=is_direct,
        created_by=g.current_user.id
    )
    db.session.add(channel)
    db.session.flush()

    # Add creator as channel member
    member = ChannelMember(channel_id=channel.id, user_id=g.current_user.id)
    db.session.add(member)

    # If direct message with another user
    target_user_id = data.get("target_user_id")
    if target_user_id and target_user_id != g.current_user.id:
        target_member = ChannelMember(channel_id=channel.id, user_id=target_user_id)
        db.session.add(target_member)

    db.session.commit()
    log_audit("channel_created", "Channel", channel.id, {"name": channel.name})
    return jsonify({"message": "Channel created", "channel": channel.to_dict()}), 201

@chat_bp.route("/channels/<int:channel_id>/messages", methods=["GET"])
@jwt_required
def get_channel_messages(channel_id):
    channel = Channel.query.get_or_404(channel_id)
    limit = int(request.args.get("limit", 100))
    before_id = request.args.get("before_id")

    query = Message.query.filter_by(channel_id=channel.id)
    if before_id:
        query = query.filter(Message.id < int(before_id))

    messages = query.order_by(Message.created_at.asc()).limit(limit).all()
    return jsonify({
        "channel": channel.to_dict(),
        "messages": [m.to_dict() for m in messages]
    })

@chat_bp.route("/channels/<int:channel_id>/messages", methods=["POST"])
@jwt_required
def post_channel_message(channel_id):
    channel = Channel.query.get_or_404(channel_id)
    data = request.get_json() or {}
    content = data.get("content", "").strip()

    if not content and not data.get("attachments"):
        return jsonify({"error": "Message content or attachment is required"}), 400

    msg = Message(
        channel_id=channel.id,
        sender_id=g.current_user.id,
        content=content,
        parent_id=data.get("parent_id"),
        message_type=data.get("message_type", "text"),
        attachments=json.dumps(data.get("attachments", []))
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({"message": "Message sent", "data": msg.to_dict()}), 201

@chat_bp.route("/messages/<int:message_id>", methods=["DELETE"])
@jwt_required
def delete_message(message_id):
    msg = Message.query.get_or_404(message_id)
    # Check permissions: author or admin
    if msg.sender_id != g.current_user.id and g.current_user.role not in ["platform_admin", "org_admin"]:
        return jsonify({"error": "Permission denied"}), 403

    msg.is_deleted = True
    db.session.commit()
    return jsonify({"message": "Message deleted"})
