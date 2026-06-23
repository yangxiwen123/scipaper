"""
Celery configuration for async tasks (PDF compilation, batch imports).
"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "sci_writer",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max per task
    task_soft_time_limit=240,  # 4 minutes soft limit
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.services"])
