import os
import uuid
from flask import Blueprint, request, jsonify, g, send_from_directory, current_app
from werkzeug.utils import secure_filename
from app.models import db, FileRecord
from app.utils.auth import jwt_required
from app.services.audit_service import log_audit

file_bp = Blueprint("files", __name__, url_prefix="/api/files")

ALLOWED_EXTENSIONS = {
    "txt", "pdf", "png", "jpg", "jpeg", "gif", "svg", "webp",
    "csv", "json", "doc", "docx", "xls", "xlsx", "zip", "tar", "gz", "md", "py", "ts", "js", "html", "css"
}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@file_bp.route("", methods=["GET"])
@jwt_required
def list_files():
    org_id = g.current_org_id
    project_id = request.args.get("project_id")
    folder = request.args.get("folder", "/")

    query = FileRecord.query
    if org_id:
        query = query.filter_by(organization_id=org_id)
    if project_id:
        query = query.filter_by(project_id=project_id)
    if folder:
        query = query.filter_by(folder_path=folder)

    files = query.order_by(FileRecord.created_at.desc()).all()
    return jsonify({"files": [f.to_dict() for f in files]})

@file_bp.route("/upload", methods=["POST"])
@jwt_required
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File type not permitted for security"}), 400

    original_name = secure_filename(file.filename)
    unique_id = uuid.uuid4().hex[:12]
    stored_filename = f"{unique_id}_{original_name}"

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)
    full_path = os.path.join(upload_folder, stored_filename)

    file.save(full_path)
    file_size = os.path.getsize(full_path)

    project_id = request.form.get("project_id")
    folder_path = request.form.get("folder_path", "/")

    file_record = FileRecord(
        organization_id=g.current_org_id,
        user_id=g.current_user.id,
        project_id=int(project_id) if project_id else None,
        filename=stored_filename,
        original_name=file.filename,
        file_size=file_size,
        mime_type=file.mimetype or "application/octet-stream",
        storage_path=full_path,
        folder_path=folder_path
    )
    db.session.add(file_record)
    db.session.commit()

    log_audit("file_uploaded", "FileRecord", file_record.id, {"filename": file_record.original_name, "size": file_size})
    return jsonify({
        "message": "File uploaded successfully",
        "file": file_record.to_dict(),
        "download_url": f"/api/files/{file_record.id}/download"
    }), 201

@file_bp.route("/<int:file_id>/download", methods=["GET"])
@jwt_required
def download_file(file_id):
    file_record = FileRecord.query.get_or_404(file_id)
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    return send_from_directory(
        upload_folder,
        file_record.filename,
        as_attachment=True,
        download_name=file_record.original_name
    )

@file_bp.route("/<int:file_id>", methods=["DELETE"])
@jwt_required
def delete_file(file_id):
    file_record = FileRecord.query.get_or_404(file_id)
    if file_record.user_id != g.current_user.id and g.current_user.role not in ["platform_admin", "org_admin"]:
        return jsonify({"error": "Permission denied"}), 403

    try:
        if os.path.exists(file_record.storage_path):
            os.remove(file_record.storage_path)
    except Exception as e:
        print(f"File delete error: {e}")

    db.session.delete(file_record)
    db.session.commit()
    log_audit("file_deleted", "FileRecord", file_id, {"filename": file_record.original_name})
    return jsonify({"message": "File deleted"})
