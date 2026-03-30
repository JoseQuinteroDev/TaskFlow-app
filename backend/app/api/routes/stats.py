from datetime import datetime, timezone

from fastapi import APIRouter, Request

from app.core.database import db
from app.core.security import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])


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

    today = datetime.now(timezone.utc).date().isoformat()
    due_today = await db.tasks.count_documents(
        {"user_id": user["id"], "due_date": {"$regex": f"^{today}"}, "status": {"$ne": "done"}}
    )
    overdue = await db.tasks.count_documents(
        {"user_id": user["id"], "due_date": {"$lt": today}, "status": {"$ne": "done"}}
    )

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
