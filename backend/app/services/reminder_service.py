import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.config import get_settings
from app.services.email_service import send_task_reminder

logger = logging.getLogger(__name__)
settings = get_settings()
scheduler = AsyncIOScheduler()


def start_scheduler() -> None:
    if not scheduler.running:
        scheduler.start()


def shutdown_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)


def remove_reminder_job(task_id: str) -> None:
    try:
        scheduler.remove_job(f"reminder_{task_id}")
    except Exception:
        return


def schedule_task_reminder(task_id: str, user: dict, task_title: str, due_date: str, reminder_iso: str) -> None:
    if not settings.SENDGRID_API_KEY or not reminder_iso:
        return

    try:
        reminder_time = datetime.fromisoformat(reminder_iso.replace("Z", "+00:00"))
        if reminder_time <= datetime.now(timezone.utc):
            return

        scheduler.add_job(
            send_task_reminder,
            "date",
            run_date=reminder_time,
            args=[user["email"], user["name"], task_title, due_date or "Not specified"],
            id=f"reminder_{task_id}",
            replace_existing=True,
        )
    except Exception as exc:
        logger.error("Failed to schedule reminder for task %s: %s", task_id, exc)
