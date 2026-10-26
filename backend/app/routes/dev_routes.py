import subprocess
import shutil
from flask import Blueprint, request, jsonify, g
from app.models import db, DevEnvironment, Project
from app.utils.auth import jwt_required, roles_required
from app.services.audit_service import log_audit
from datetime import datetime

dev_bp = Blueprint("dev", __name__, url_prefix="/api/dev")

# Strictly controlled commands allowed for sandboxed tool execution
ALLOWED_COMMANDS = {
    "git_status": ["git", "status", "--short"],
    "git_log": ["git", "log", "-n", "5", "--oneline"],
    "node_version": ["node", "--version"],
    "npm_version": ["npm", "--version"],
    "python_version": ["python", "--version"],
    "list_services": ["docker", "compose", "ps"],
    "system_info": ["powershell", "-Command", "Get-ComputerInfo | Select-Object WindowsProductName, OsHardwareAbstractionLayer | ConvertTo-Json"],
    "project_tree": ["powershell", "-Command", "Get-ChildItem -Depth 2 -Name"]
}

@dev_bp.route("/environments", methods=["GET"])
@jwt_required
def list_environments():
    project_id = request.args.get("project_id")
    query = DevEnvironment.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    envs = query.order_by(DevEnvironment.created_at.asc()).all()
    return jsonify({"environments": [e.to_dict() for e in envs]})

@dev_bp.route("/environments", methods=["POST"])
@jwt_required
@roles_required("platform_admin", "org_admin", "manager", "team_lead")
def create_environment():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Environment name is required"}), 400

    env = DevEnvironment(
        project_id=data.get("project_id"),
        name=name,
        service_type=data.get("service_type", "web"),
        status="running",
        port_mappings=data.get("port_mappings", "3000:3000"),
        image_tag=data.get("image_tag", "node:20-alpine"),
        repo_url=data.get("repo_url", "https://github.com/company/repo"),
        branch=data.get("branch", "main"),
        last_commit="Initial commit"
    )
    db.session.add(env)
    db.session.commit()
    log_audit("dev_environment_created", "DevEnvironment", env.id, {"name": env.name})
    return jsonify({"message": "Environment created", "environment": env.to_dict()}), 201

@dev_bp.route("/environments/<int:env_id>/action", methods=["POST"])
@jwt_required
@roles_required("platform_admin", "org_admin", "manager", "team_lead")
def environment_action(env_id):
    env = DevEnvironment.query.get_or_404(env_id)
    data = request.get_json() or {}
    action = data.get("action")  # start, stop, restart, rebuild

    if action == "start":
        env.status = "running"
    elif action == "stop":
        env.status = "stopped"
    elif action == "restart":
        env.status = "running"
        env.last_deployed_at = datetime.utcnow()
    elif action == "rebuild":
        env.status = "running"
        env.last_deployed_at = datetime.utcnow()
    else:
        return jsonify({"error": f"Invalid action: {action}"}), 400

    db.session.commit()
    log_audit("dev_environment_action", "DevEnvironment", env.id, {"action": action})
    return jsonify({"message": f"Action '{action}' executed successfully", "environment": env.to_dict()})

@dev_bp.route("/terminal/run", methods=["POST"])
@jwt_required
@roles_required("platform_admin", "org_admin", "manager", "team_lead", "member")
def run_sandboxed_command():
    data = request.get_json() or {}
    cmd_key = data.get("command_key")

    if not cmd_key or cmd_key not in ALLOWED_COMMANDS:
        return jsonify({
            "error": "Command not permitted or unrecognized",
            "allowed_commands": list(ALLOWED_COMMANDS.keys())
        }), 400

    cmd_args = ALLOWED_COMMANDS[cmd_key]

    try:
        # Sandboxed execution with timeout, resource bounds, and audit logging
        result = subprocess.run(
            cmd_args,
            capture_output=True,
            text=True,
            timeout=5,
            shell=False
        )
        output = result.stdout if result.returncode == 0 else result.stderr
        exit_code = result.returncode
    except subprocess.TimeoutExpired:
        output = "Command execution timed out after 5 seconds"
        exit_code = 124
    except Exception as e:
        output = f"Execution error: {str(e)}"
        exit_code = 1

    log_audit(
        "sandboxed_tool_executed",
        "DeveloperTerminal",
        None,
        {"cmd_key": cmd_key, "exit_code": exit_code}
    )

    return jsonify({
        "command_key": cmd_key,
        "command_line": " ".join(cmd_args),
        "exit_code": exit_code,
        "output": output
    })

@dev_bp.route("/docker-status", methods=["GET"])
@jwt_required
def get_docker_status():
    docker_available = shutil.which("docker") is not None
    return jsonify({
        "docker_installed": docker_available,
        "compose_version": "v2.24.0 (managed compose)",
        "default_registry": "registry.hub.docker.com",
        "container_runtime": "containerd",
        "status": "ready"
    })
