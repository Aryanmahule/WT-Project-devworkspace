from flask import Blueprint, request, jsonify, g
from app.models import db, Notification
from app.utils.auth import jwt_required

notification_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")

@notification_bp.route("", methods=["GET"])
@jwt_required
def get_notifications():
    notifications = Notification.query.filter_by(user_id=g.current_user.id).order_by(Notification.created_at.desc()).limit(30).all()
    unread_count = Notification.query.filter_by(user_id=g.current_user.id, is_read=False).count()
    return jsonify({
        "notifications": [n.to_dict() for n in notifications],
        "unread_count": unread_count
    })

@notification_bp.route("/<int:notif_id>/read", methods=["PUT"])
@jwt_required
def mark_read(notif_id):
    notif = Notification.query.filter_by(id=notif_id, user_id=g.current_user.id).first_or_404()
    notif.is_read = True
    db.session.commit()
    return jsonify({"message": "Marked as read", "notification": notif.to_dict()})

@notification_bp.route("/read-all", methods=["PUT"])
@jwt_required
def mark_all_read():
    Notification.query.filter_by(user_id=g.current_user.id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "All marked as read"})
