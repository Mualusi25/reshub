import os
from datetime import timedelta
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, ".env"))


def _database_url():
    url = os.getenv("DATABASE_URL")
    if not url:
        return "sqlite:///" + os.path.join(basedir, "reshub.db")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def _flag(name, default="true"):
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes", "on")


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me-in-production-0000")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-key-change-me-in-production-0000")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    UPLOAD_FOLDER = os.path.join(basedir, "uploads")
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB

    # Email. Leave MAIL_SERVER empty and emails are printed in the terminal instead.
    MAIL_SERVER = os.getenv("MAIL_SERVER", "")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USE_TLS = _flag("MAIL_USE_TLS", "true")
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM = os.getenv("MAIL_FROM", "ResHub <no-reply@reshub.co.za>")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


# Refuse to start on Render with the development secrets
if os.getenv("RENDER") and (
    Config.SECRET_KEY.startswith("dev-") or Config.JWT_SECRET_KEY.startswith("dev-")
):
    raise RuntimeError("SECRET_KEY and JWT_SECRET_KEY must be set in production.")
