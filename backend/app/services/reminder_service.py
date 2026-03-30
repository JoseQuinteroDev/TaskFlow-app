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


def remove_reminder_jobs(task_id: str) -> None:
    for suffix in ["once", "recurring"]:
        try:
            scheduler.remove_job(f"reminder_{suffix}_{task_id}")
        except Exception:
            continue


def _parse_datetime(value):
    if not value:
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def schedule_task_reminders(task_id: str, user: dict, task_doc: dict) -> None:
    if not settings.SENDGRID_API_KEY:
        return

    reminder_type = task_doc.get("reminder_type") or ("once" if task_doc.get("reminder") else "none")
    due_at = _parse_datetime(task_doc.get("due_at") or task_doc.get("due_date"))
    due_label = due_at.strftime("%d %b %Y, %H:%M UTC") if due_at else "Not specified"

    remove_reminder_jobs(task_id)

    try:
        if reminder_type == "once":
            reminder_at = _parse_datetime(task_doc.get("reminder_once_at") or task_doc.get("reminder"))
            if reminder_at and reminder_at > datetime.now(timezone.utc):
                scheduler.add_job(
                    send_task_reminder,
                    "date",
                    run_date=reminder_at,
                    args=[user["email"], user["name"], task_doc["title"], due_label],
                    id=f"reminder_once_{task_id}",
                    replace_existing=True,
                )

        if reminder_type == "recurring":
            repeat_every_minutes = task_doc.get("repeat_every_minutes")
            repeat_start_at = _parse_datetime(task_doc.get("repeat_start_at"))
            repeat_end_at = _parse_datetime(task_doc.get("repeat_end_at"))

            if repeat_every_minutes and repeat_start_at and repeat_end_at and repeat_end_at > datetime.now(timezone.utc):
                scheduler.add_job(
                    send_task_reminder,
                    "interval",
                    minutes=int(repeat_every_minutes),
                    start_date=repeat_start_at,
                    end_date=repeat_end_at,
                    args=[user["email"], user["name"], task_doc["title"], due_label],
                    id=f"reminder_recurring_{task_id}",
                    replace_existing=True,
                )
    except Exception as exc:
        logger.error("Failed to schedule reminder for task %s: %s", task_id, exc)
