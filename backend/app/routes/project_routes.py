from flask import Blueprint, request, jsonify, g
from app.models import db, Project, Milestone, User, Team
from app.utils.auth import jwt_required, roles_required
from app.services.audit_service import log_audit
from datetime import datetime

project_bp = Blueprint("projects", __name__, url_prefix="/api")

@project_bp.route("/projects", methods=["GET"])
@jwt_required
def list_projects():
    org_id = g.current_org_id
    team_id = request.args.get("team_id")
    status = request.args.get("status")

    query = Project.query
    if org_id:
        query = query.filter_by(organization_id=org_id)
    if team_id:
        query = query.filter_by(team_id=team_id)
    if status:
        query = query.filter_by(status=status)

    projects = query.order_by(Project.created_at.desc()).all()
    return jsonify({"projects": [p.to_dict() for p in projects]})

@project_bp.route("/projects/<int:project_id>", methods=["GET"])
@jwt_required
def get_project(project_id):
    project = Project.query.get_or_404(project_id)
    project_dict = project.to_dict()
    project_dict["milestones"] = [m.to_dict() for m in project.milestones.all()]
    return jsonify({"project": project_dict})

@project_bp.route("/projects", methods=["POST"])
@jwt_required
@roles_required("platform_admin", "org_admin", "manager", "team_lead")
def create_project():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    key = data.get("key", "").strip().upper()

    if not name or not key:
        return jsonify({"error": "Project name and key are required"}), 400

    start_date = None
    due_date = None
    if data.get("start_date"):
        try:
            start_date = datetime.strptime(data["start_date"][:10], "%Y-%m-%d").date()
        except:
            pass
    if data.get("due_date"):
        try:
            due_date = datetime.strptime(data["due_date"][:10], "%Y-%m-%d").date()
        except:
            pass

    project = Project(
        organization_id=g.current_org_id,
        team_id=data.get("team_id"),
        name=name,
        key=key,
        description=data.get("description", ""),
        status=data.get("status", "active"),
        priority=data.get("priority", "medium"),
        start_date=start_date,
        due_date=due_date,
        owner_id=data.get("owner_id", g.current_user.id)
    )
    db.session.add(project)
    db.session.commit()

    log_audit("project_created", "Project", project.id, {"name": project.name, "key": project.key})
    return jsonify({"message": "Project created successfully", "project": project.to_dict()}), 201

@project_bp.route("/projects/<int:project_id>", methods=["PUT"])
@jwt_required
@roles_required("platform_admin", "org_admin", "manager", "team_lead")
def update_project(project_id):
    project = Project.query.get_or_404(project_id)
    data = request.get_json() or {}

    if "name" in data:
        project.name = data["name"].strip()
    if "description" in data:
        project.description = data["description"]
    if "status" in data:
        project.status = data["status"]
    if "priority" in data:
        project.priority = data["priority"]
    if "team_id" in data:
        project.team_id = data["team_id"]
    if "due_date" in data:
        try:
            project.due_date = datetime.strptime(data["due_date"][:10], "%Y-%m-%d").date() if data["due_date"] else None
        except:
            pass

    db.session.commit()
    log_audit("project_updated", "Project", project.id, {"updates": list(data.keys())})
    return jsonify({"message": "Project updated", "project": project.to_dict()})

@project_bp.route("/projects/<int:project_id>/milestones", methods=["GET"])
@jwt_required
def get_milestones(project_id):
    project = Project.query.get_or_404(project_id)
    milestones = project.milestones.all()
    return jsonify({"milestones": [m.to_dict() for m in milestones]})

@project_bp.route("/projects/<int:project_id>/milestones", methods=["POST"])
@jwt_required
@roles_required("platform_admin", "org_admin", "manager", "team_lead")
def create_milestone(project_id):
    project = Project.query.get_or_404(project_id)
    data = request.get_json() or {}
    title = data.get("title", "").strip()

    if not title:
        return jsonify({"error": "Milestone title is required"}), 400

    due_date = None
    if data.get("due_date"):
        try:
            due_date = datetime.strptime(data["due_date"][:10], "%Y-%m-%d").date()
        except:
            pass

    milestone = Milestone(
        project_id=project.id,
        title=title,
        description=data.get("description", ""),
        due_date=due_date,
        status="open"
    )
    db.session.add(milestone)
    db.session.commit()
    return jsonify({"message": "Milestone created", "milestone": milestone.to_dict()}), 201
