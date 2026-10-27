import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_migrate import Migrate
from app.models import db
from app.config import config_by_name

socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")
migrate = Migrate()

def create_app(config_name="development"):
    app = Flask(__name__)
    config_obj = config_by_name.get(config_name, config_by_name["development"])
    app.config.from_object(config_obj)

    # Ensure upload directory exists safely (ignoring read-only filesystem errors)
    try:
        os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    except Exception as e:
        print(f"[WARN] Could not create UPLOAD_FOLDER: {e}")

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    socketio.init_app(app)

    # Ensure tables exist and auto-seed if empty
    with app.app_context():
        try:
            db.create_all()
            from app.models import User
            if not User.query.first():
                from seed_data import seed_database
                seed_database()
        except Exception as e:
            print(f"[WARN] Database initialization: {e}")

    # Register real-time socket events
    from app.services.socket_events import register_socket_events
    register_socket_events(socketio)

    # Register Blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.org_routes import org_bp
    from app.routes.project_routes import project_bp
    from app.routes.task_routes import task_bp
    from app.routes.chat_routes import chat_bp
    from app.routes.meeting_routes import meeting_bp
    from app.routes.whiteboard_routes import whiteboard_bp
    from app.routes.calendar_routes import calendar_bp
    from app.routes.planner_routes import planner_bp
    from app.routes.file_routes import file_bp
    from app.routes.dev_routes import dev_bp
    from app.routes.analytics_routes import analytics_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.notification_routes import notification_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(org_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(meeting_bp)
    app.register_blueprint(whiteboard_bp)
    app.register_blueprint(calendar_bp)
    app.register_blueprint(planner_bp)
    app.register_blueprint(file_bp)
    app.register_blueprint(dev_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(notification_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "Apex Corporate Workspace API",
            "database": "connected",
            "socketio": "active",
            "version": "1.0.0"
        })

    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

    return app
