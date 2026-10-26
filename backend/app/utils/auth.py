import functools
from datetime import datetime, timedelta
import jwt
from flask import request, jsonify, current_app, g
from app.models import User

def generate_token(user_id, role, organization_id=None, expires_in_days=7):
    payload = {
        "sub": user_id,
        "role": role,
        "org_id": organization_id,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(days=expires_in_days)
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")

def decode_token(token):
    try:
        payload = jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def jwt_required(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization header missing"}), 401
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Invalid Authorization header format. Expected 'Bearer <token>'"}), 401
        
        token = parts[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        user = User.query.get(payload["sub"])
        if not user or user.status != "active":
            return jsonify({"error": "User account inactive or not found"}), 403
        
        g.current_user = user
        g.current_org_id = user.organization_id
        return f(*args, **kwargs)
    return decorated_function

def roles_required(*allowed_roles):
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, "current_user") or not g.current_user:
                return jsonify({"error": "Authentication required"}), 401
            
            user = g.current_user
            # Platform admin has access to everything
            if user.role == "platform_admin":
                return f(*args, **kwargs)
                
            if user.role not in allowed_roles:
                return jsonify({"error": "Forbidden: insufficient permissions for this operation"}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
