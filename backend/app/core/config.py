"""
Application configuration via pydantic-settings.
Reads from environment variables with sensible defaults for development.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "SCI Writer"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    SECRET_KEY: str = "dev-secret-key-change-in-production"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/sci_writer"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/sci_writer"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    EXPORT_DIR: str = "./exports"
    TEMPLATE_DIR: str = "../templates"

    # TeX Live
    XELATEX_PATH: str = "xelatex"
    PANDOC_PATH: str = "pandoc"

    # External APIs
    LANGUAGE_TOOL_URL: str = "http://localhost:8010/v2/check"
    GRAMMARLY_API_KEY: Optional[str] = None
    ITHENTICATE_API_KEY: Optional[str] = None

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
