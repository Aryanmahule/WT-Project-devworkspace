import os
import shutil
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Check if running in serverless (Vercel, AWS Lambda) or a read-only filesystem
IS_SERVERLESS = bool(
    os.getenv("VERCEL")
    or os.getenv("AWS_LAMBDA_FUNCTION_NAME")
    or not os.access(BASE_DIR, os.W_OK)
)

if IS_SERVERLESS:
    DATA_DIR = "/tmp"
    src_db = os.path.join(BASE_DIR, "devplatform.db")
    dst_db = os.path.join(DATA_DIR, "devplatform.db")
    # Copy pre-seeded SQLite database to writable /tmp if not present
    if os.path.exists(src_db) and not os.path.exists(dst_db):
        try:
            shutil.copy2(src_db, dst_db)
            print(f"[*] Successfully copied pre-seeded database to {dst_db}")
        except Exception as e:
            print(f"[WARN] Failed to copy seed DB to /tmp: {e}")
    DEFAULT_DB_PATH = dst_db
    DEFAULT_UPLOAD_PATH = os.path.join(DATA_DIR, "uploads")
else:
    DEFAULT_DB_PATH = os.path.join(BASE_DIR, "devplatform.db")
    DEFAULT_UPLOAD_PATH = os.path.join(BASE_DIR, "uploads")

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-corporate-secret-key-super-secure-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-key-super-secure-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    
    # Handle DATABASE_URL from environment (supports PostgreSQL, MySQL, SQLite)
    raw_url = os.getenv("DATABASE_URL")
    if raw_url:
        if raw_url.startswith("postgres://"):
            raw_url = raw_url.replace("postgres://", "postgresql://", 1)
        SQLALCHEMY_DATABASE_URI = raw_url
    else:
        # Standardize SQLite URI (4 slashes for Unix absolute paths like /tmp, 3 for Windows)
        normalized_path = DEFAULT_DB_PATH.replace("\\", "/")
        if normalized_path.startswith("/"):
            SQLALCHEMY_DATABASE_URI = f"sqlite:////{normalized_path.lstrip('/')}"
        else:
            SQLALCHEMY_DATABASE_URI = f"sqlite:///{normalized_path}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", DEFAULT_UPLOAD_PATH)
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB limit
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    AUDIT_LOG_ENABLED = True

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SECRET_KEY = "test-secret-key"

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = Config.SQLALCHEMY_DATABASE_URI

config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
