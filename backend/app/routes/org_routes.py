from flask import Blueprint, request, jsonify, g
from app.models import db, Organization, Department, Team, TeamMember, User
from app.utils.auth import jwt_required, roles_required
from app.services.audit_service import log_audit

org_bp = Blueprint("orgs", __name__, url_prefix="/api")

@org_bp.route("/orgs", methods=["GET"])
@jwt_required
def list_orgs():
    orgs = Organization.query.all()
    return jsonify({"organizations": [o.to_dict() for o in orgs]})

@org_bp.route("/orgs/<int:org_id>", methods=["GET"])
@jwt_required
def get_org(org_id):
    org = Organization.query.get_or_404(org_id)
    return jsonify({"organization": org.to_dict()})

@org_bp.route("/departments", methods=["GET"])
@jwt_required
def list_departments():
    org_id = g.current_org_id
    query = Department.query
    if org_id:
        query = query.filter_by(organization_id=org_id)
    departments = query.all()
    return jsonify({"departments": [d.to_dict() for d in departments]})

@org_bp.route("/departments", methods=["POST"])
@jwt_required
@roles_required("platform_admin", "org_admin")
def create_department():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Department name is required"}), 400

    dept = Department(
        organization_id=g.current_org_id,
        name=name,
        code=data.get("code", "").upper(),
        description=data.get("description", ""),
        manager_id=data.get("manager_id")
    )
    db.session.add(dept)
    db.session.commit()
    log_audit("department_created", "Department", dept.id, {"name": dept.name})
    return jsonify({"message": "Department created", "department": dept.to_dict()}), 201

@org_bp.route("/teams", methods=["GET"])
@jwt_required
def list_teams():
    org_id = g.current_org_id
    query = Team.query
    if org_id:
        query = query.filter_by(organization_id=org_id)
    teams = query.all()
    return jsonify({"teams": [t.to_dict() for t in teams]})

@org_bp.route("/teams", methods=["POST"])
@jwt_required
@roles_required("platform_admin", "org_admin", "manager")
def create_team():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Team name is required"}), 400

    team = Team(
        organization_id=g.current_org_id,
        department_id=data.get("department_id"),
        name=name,
        description=data.get("description", ""),
        lead_id=data.get("lead_id", g.current_user.id),
        is_private=data.get("is_private", False)
    )
    db.session.add(team)
    db.session.flush()

    # Automatically add creator as team leader
    member = TeamMember(team_id=team.id, user_id=g.current_user.id, role_in_team="leader")
    db.session.add(member)
    db.session.commit()

    log_audit("team_created", "Team", team.id, {"name": team.name})
    return jsonify({"message": "Team created", "team": team.to_dict()}), 201

@org_bp.route("/teams/<int:team_id>/members", methods=["GET"])
@jwt_required
def get_team_members(team_id):
    team = Team.query.get_or_404(team_id)
    members = TeamMember.query.filter_by(team_id=team.id).all()
    return jsonify({"members": [m.to_dict() for m in members]})

@org_bp.route("/teams/<int:team_id>/members", methods=["POST"])
@jwt_required
@roles_required("platform_admin", "org_admin", "manager", "team_lead")
def add_team_member(team_id):
    team = Team.query.get_or_404(team_id)
    data = request.get_json() or {}
    user_id = data.get("user_id")
    role_in_team = data.get("role_in_team", "contributor")

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    existing = TeamMember.query.filter_by(team_id=team.id, user_id=user_id).first()
    if existing:
        existing.role_in_team = role_in_team
        db.session.commit()
        return jsonify({"message": "Member role updated", "member": existing.to_dict()})

    new_member = TeamMember(team_id=team.id, user_id=user_id, role_in_team=role_in_team)
    db.session.add(new_member)
    db.session.commit()
    log_audit("team_member_added", "TeamMember", new_member.id, {"team_id": team.id, "user_id": user_id})
    return jsonify({"message": "Member added to team", "member": new_member.to_dict()}), 201
