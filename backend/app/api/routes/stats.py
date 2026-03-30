from datetime import datetime, timezone

from fastapi import APIRouter, Request

from app.core.database import db
from app.core.security import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])


def parse_due_datetime(task: dict):
    value = task.get("due_at") or task.get("due_date")
    if not value:
        return None
    if isinstance(value, datetime):
        due_dt = value
    else:
        try:
            due_dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            return None

    if due_dt.tzinfo is None:
        due_dt = due_dt.replace(tzinfo=timezone.utc)
    return due_dt.astimezone(timezone.utc)


@router.get("")
async def get_stats(request: Request):
    user = await get_current_user(request)

    total = await db.tasks.count_documents({"user_id": user["id"]})
    todo = await db.tasks.count_documents({"user_id": user["id"], "status": "todo"})
    in_progress = await db.tasks.count_documents({"user_id": user["id"], "status": "in_progress"})
    done = await db.tasks.count_documents({"user_id": user["id"], "status": "done"})
    high_priority = await db.tasks.count_documents(
        {"user_id": user["id"], "priority": "high", "status": {"$ne": "done"}}
    )

    now = datetime.now(timezone.utc)
    today = now.date()
    due_today = 0
    overdue = 0

    open_tasks = await db.tasks.find({"user_id": user["id"], "status": {"$ne": "done"}}).to_list(2000)
    for task in open_tasks:
        due_dt = parse_due_datetime(task)
        if not due_dt:
            continue
        if due_dt.date() == today:
            due_today += 1
        if due_dt < now:
            overdue += 1

    return {
        "total": total,
        "todo": todo,
        "in_progress": in_progress,
        "done": done,
        "high_priority": high_priority,
        "due_today": due_today,
        "overdue": overdue,
        "completion_rate": round((done / total * 100) if total > 0 else 0, 1),
    }
