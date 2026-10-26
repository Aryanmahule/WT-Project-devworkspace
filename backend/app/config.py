import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-corporate-secret-key-super-secure-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-key-super-secure-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    
    # Primary database MySQL, with graceful automatic fallback to SQLite for immediate local execution
    DATABASE_URL = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{os.path.join(BASE_DIR, 'devplatform.db')}"
    )
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Upload configuration
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB limit
    
    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # Audit log settings
    AUDIT_LOG_ENABLED = True

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SECRET_KEY = "test-secret-key"

class ProductionConfig(Config):
    DEBUG = False
    # Enforce database url from environment in production, with fallback to default
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", Config.DATABASE_URL)

config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
