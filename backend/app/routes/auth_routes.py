from flask import Blueprint, request, jsonify, g
from app.models import db, User, Organization
from app.utils.auth import generate_token, jwt_required, roles_required
from app.services.audit_service import log_audit
from datetime import datetime

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    username = data.get("username", "").strip()
    password = data.get("password")
    full_name = data.get("full_name", "").strip()
    job_title = data.get("job_title", "Team Member")
    role = data.get("role", "member")
    org_id = data.get("organization_id")

    if not email or not username or not password or not full_name:
        return jsonify({"error": "Missing required fields: email, username, password, full_name"}), 400

    if User.query.filter((User.email == email) | (User.username == username)).first():
        return jsonify({"error": "User with this email or username already exists"}), 409

    # If no org specified, attach to first org if exists
    if not org_id:
        first_org = Organization.query.first()
        if first_org:
            org_id = first_org.id

    user = User(
        email=email,
        username=username,
        full_name=full_name,
        job_title=job_title,
        role=role,
        organization_id=org_id,
        status="active"
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = generate_token(user.id, user.role, user.organization_id)
    log_audit("user_registered", "User", user.id, {"username": user.username, "email": user.email}, user.id, user.organization_id)

    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": user.to_dict()
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email_or_username = data.get("email_or_username", "").strip()
    password = data.get("password", "")

    if not email_or_username or not password:
        return jsonify({"error": "Please provide email/username and password"}), 400

    user = User.query.filter(
        (User.email == email_or_username.lower()) | (User.username == email_or_username)
    ).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    if user.status != "active":
        return jsonify({"error": f"Account is {user.status}. Please contact an administrator."}), 403

    token = generate_token(user.id, user.role, user.organization_id)
    log_audit("user_login", "User", user.id, {"username": user.username}, user.id, user.organization_id)

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user.to_dict()
    }), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required
def get_current_user():
    return jsonify({
        "user": g.current_user.to_dict(),
        "organization": g.current_user.organization.to_dict() if g.current_user.organization else None
    })

@auth_bp.route("/profile", methods=["PUT"])
@jwt_required
def update_profile():
    user = g.current_user
    data = request.get_json() or {}

    if "full_name" in data:
        user.full_name = data["full_name"].strip()
    if "job_title" in data:
        user.job_title = data["job_title"].strip()
    if "phone" in data:
        user.phone = data["phone"].strip()
    if "bio" in data:
        user.bio = data["bio"]
    if "avatar_url" in data:
        user.avatar_url = data["avatar_url"]
    if "timezone" in data:
        user.timezone = data["timezone"]

    db.session.commit()
    log_audit("profile_updated", "User", user.id, {"updates": list(data.keys())})
    return jsonify({"message": "Profile updated successfully", "user": user.to_dict()})

@auth_bp.route("/change-password", methods=["POST"])
@jwt_required
def change_password():
    user = g.current_user
    data = request.get_json() or {}
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        return jsonify({"error": "Both old and new passwords are required"}), 400

    if not user.check_password(old_password):
        return jsonify({"error": "Current password is incorrect"}), 400

    user.set_password(new_password)
    db.session.commit()
    log_audit("password_changed", "User", user.id)
    return jsonify({"message": "Password changed successfully"})

@auth_bp.route("/users", methods=["GET"])
@jwt_required
def list_users():
    org_id = g.current_org_id
    query = User.query
    if org_id:
        query = query.filter_by(organization_id=org_id)
    users = query.all()
    return jsonify({"users": [u.to_dict() for u in users]})
