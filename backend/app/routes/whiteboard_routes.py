from flask import Blueprint, request, jsonify, g
from app.models import db, Whiteboard
from app.utils.auth import jwt_required
from app.services.audit_service import log_audit
import json

whiteboard_bp = Blueprint("whiteboards", __name__, url_prefix="/api")

@whiteboard_bp.route("/whiteboards", methods=["GET"])
@jwt_required
def list_whiteboards():
    org_id = g.current_org_id
    team_id = request.args.get("team_id")
    project_id = request.args.get("project_id")

    query = Whiteboard.query
    if org_id:
        query = query.filter_by(organization_id=org_id)
    if team_id:
        query = query.filter_by(team_id=team_id)
    if project_id:
        query = query.filter_by(project_id=project_id)

    boards = query.order_by(Whiteboard.updated_at.desc()).all()
    return jsonify({"whiteboards": [b.to_dict() for b in boards]})

@whiteboard_bp.route("/whiteboards/<int:board_id>", methods=["GET"])
@jwt_required
def get_whiteboard(board_id):
    board = Whiteboard.query.get_or_404(board_id)
    return jsonify({"whiteboard": board.to_dict()})

@whiteboard_bp.route("/whiteboards", methods=["POST"])
@jwt_required
def create_whiteboard():
    data = request.get_json() or {}
    title = data.get("title", "").strip()

    if not title:
        return jsonify({"error": "Whiteboard title is required"}), 400

    initial_data = data.get("board_data", {"elements": [], "version": 1})
    board = Whiteboard(
        organization_id=g.current_org_id,
        team_id=data.get("team_id"),
        project_id=data.get("project_id"),
        title=title,
        board_data=json.dumps(initial_data),
        created_by=g.current_user.id
    )
    db.session.add(board)
    db.session.commit()

    log_audit("whiteboard_created", "Whiteboard", board.id, {"title": board.title})
    return jsonify({"message": "Whiteboard created", "whiteboard": board.to_dict()}), 201

@whiteboard_bp.route("/whiteboards/<int:board_id>", methods=["PUT"])
@jwt_required
def update_whiteboard(board_id):
    board = Whiteboard.query.get_or_404(board_id)
    data = request.get_json() or {}

    if "title" in data:
        board.title = data["title"].strip()
    if "board_data" in data:
        board.board_data = json.dumps(data["board_data"])
    if "thumbnail_url" in data:
        board.thumbnail_url = data["thumbnail_url"]

    db.session.commit()
    return jsonify({"message": "Whiteboard saved", "whiteboard": board.to_dict()})

@whiteboard_bp.route("/whiteboards/<int:board_id>", methods=["DELETE"])
@jwt_required
def delete_whiteboard(board_id):
    board = Whiteboard.query.get_or_404(board_id)
    if board.created_by != g.current_user.id and g.current_user.role not in ["platform_admin", "org_admin"]:
        return jsonify({"error": "Permission denied"}), 403

    db.session.delete(board)
    db.session.commit()
    log_audit("whiteboard_deleted", "Whiteboard", board_id)
    return jsonify({"message": "Whiteboard deleted"})
