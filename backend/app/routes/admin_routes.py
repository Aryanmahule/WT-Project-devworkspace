from flask import Blueprint, request, jsonify, g
from app.models import db, User, Organization, AuditLog, Department, Team
from app.utils.auth import jwt_required, roles_required
from app.services.audit_service import log_audit
import json

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

@admin_bp.route("/users", methods=["GET"])
@jwt_required
@roles_required("platform_admin", "org_admin")
def list_admin_users():
    org_id = g.current_org_id
    query = User.query
    if g.current_user.role != "platform_admin" and org_id:
        query = query.filter_by(organization_id=org_id)
    users = query.order_by(User.created_at.desc()).all()
    return jsonify({"users": [u.to_dict() for u in users]})

@admin_bp.route("/users/<int:user_id>/status", methods=["PUT"])
@jwt_required
@roles_required("platform_admin", "org_admin")
def update_user_status(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    status = data.get("status")
    role = data.get("role")

    if status and status in ["active", "suspended", "pending"]:
        user.status = status
    if role and role in ["platform_admin", "org_admin", "manager", "team_lead", "member", "guest"]:
        user.role = role

    db.session.commit()
    log_audit("user_status_updated", "User", user.id, {"status": user.status, "role": user.role})
    return jsonify({"message": "User updated", "user": user.to_dict()})

@admin_bp.route("/audit-logs", methods=["GET"])
@jwt_required
@roles_required("platform_admin", "org_admin")
def get_audit_logs():
    org_id = g.current_org_id
    limit = int(request.args.get("limit", 50))
    query = AuditLog.query
    if g.current_user.role != "platform_admin" and org_id:
        query = query.filter_by(organization_id=org_id)

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return jsonify({"audit_logs": [l.to_dict() for l in logs]})

@admin_bp.route("/organization/settings", methods=["GET", "PUT"])
@jwt_required
@roles_required("platform_admin", "org_admin")
def org_settings():
    org = Organization.query.get(g.current_org_id)
    if not org:
        org = Organization.query.first()
    
    if not org:
        return jsonify({"error": "Organization not found"}), 404

    if request.method == "PUT":
        data = request.get_json() or {}
        if "name" in data:
            org.name = data["name"].strip()
        if "description" in data:
            org.description = data["description"]
        if "settings" in data:
            org.settings = json.dumps(data["settings"])
        db.session.commit()
        log_audit("org_settings_updated", "Organization", org.id)

    return jsonify({"organization": org.to_dict()})
