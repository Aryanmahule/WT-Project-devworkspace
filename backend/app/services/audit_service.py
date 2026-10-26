import json
from flask import request, g
from app.models import db, AuditLog

def log_audit(action, target_type=None, target_id=None, details=None, user_id=None, org_id=None):
    try:
        if user_id is None and hasattr(g, "current_user") and g.current_user:
            user_id = g.current_user.id
        
        if org_id is None and hasattr(g, "current_org_id"):
            org_id = g.current_org_id

        ip_address = request.remote_addr if request else "127.0.0.1"

        log_entry = AuditLog(
            organization_id=org_id,
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=json.dumps(details or {}),
            ip_address=ip_address
        )
        db.session.add(log_entry)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[AUDIT LOG ERROR] Failed to record audit log: {e}")
