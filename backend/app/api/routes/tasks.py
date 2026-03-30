from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request

from app.core.database import db
from app.core.security import get_current_user
from app.models.schemas import StatusUpdate, TaskCreate, TaskResponse, TaskUpdate
from app.services.reminder_service import remove_reminder_jobs, schedule_task_reminders
from app.services.reminder_service import remove_reminder_job, schedule_task_reminder

router = APIRouter(prefix="/tasks", tags=["tasks"])


def parse_datetime_input(value: Optional[str | datetime]) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def to_iso(value: Optional[datetime]) -> Optional[str]:
    return value.astimezone(timezone.utc).isoformat() if value else None


def normalize_reminders(payload: TaskCreate | TaskUpdate) -> dict:
    reminder_type = payload.reminder_type or "none"
    reminder_once_at = parse_datetime_input(payload.reminder_once_at or payload.reminder)

    if reminder_type == "none":
        return {
            "reminder_type": "none",
            "reminder": None,
            "reminder_once_at": None,
            "repeat_every_minutes": None,
            "repeat_start_at": None,
            "repeat_end_at": None,
        }

    if reminder_type == "once":
        return {
            "reminder_type": "once",
            "reminder": to_iso(reminder_once_at),
            "reminder_once_at": reminder_once_at,
            "repeat_every_minutes": None,
            "repeat_start_at": None,
            "repeat_end_at": None,
        }

    return {
        "reminder_type": "recurring",
        "reminder": None,
        "reminder_once_at": None,
        "repeat_every_minutes": payload.repeat_every_minutes,
        "repeat_start_at": parse_datetime_input(payload.repeat_start_at),
        "repeat_end_at": parse_datetime_input(payload.repeat_end_at),
    }


def serialize_task(task: dict) -> TaskResponse:
    due_at = parse_datetime_input(task.get("due_at") or task.get("due_date"))
    reminder_once_at = parse_datetime_input(task.get("reminder_once_at") or task.get("reminder"))
    reminder_type = task.get("reminder_type") or ("once" if reminder_once_at else "none")

    repeat_start_at = parse_datetime_input(task.get("repeat_start_at"))
    repeat_end_at = parse_datetime_input(task.get("repeat_end_at"))

def serialize_task(task: dict) -> TaskResponse:
    return TaskResponse(
        id=str(task["_id"]),
        title=task["title"],
        description=task.get("description", ""),
        status=task["status"],
        priority=task["priority"],
        due_date=to_iso(due_at),
        due_at=to_iso(due_at),
        category=task.get("category"),
        tags=task.get("tags", []),
        reminder=to_iso(reminder_once_at),
        reminder_type=reminder_type,
        reminder_once_at=to_iso(reminder_once_at),
        repeat_every_minutes=task.get("repeat_every_minutes"),
        repeat_start_at=to_iso(repeat_start_at),
        repeat_end_at=to_iso(repeat_end_at),
        due_date=task.get("due_date"),
        category=task.get("category"),
        tags=task.get("tags", []),
        reminder=task.get("reminder"),
        user_id=task["user_id"],
        created_at=task["created_at"],
        updated_at=task["updated_at"],
    )


@router.post("", response_model=TaskResponse)
async def create_task(task_data: TaskCreate, request: Request):
    user = await get_current_user(request)
    now_iso = datetime.now(timezone.utc).isoformat()

    due_at = parse_datetime_input(task_data.due_at or task_data.due_date)
    reminders = normalize_reminders(task_data)

    task_doc = {
        "title": task_data.title,
        "description": task_data.description or "",
        "status": task_data.status,
        "priority": task_data.priority,
        "due_at": due_at,
        "due_date": to_iso(due_at),
        "category": task_data.category,
        "tags": task_data.tags,
        **reminders,
        "due_date": task_data.due_date,
        "category": task_data.category,
        "tags": task_data.tags,
        "reminder": task_data.reminder,
        "user_id": user["id"],
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    result = await db.tasks.insert_one(task_doc)
    task_doc["_id"] = result.inserted_id
    schedule_task_reminders(str(result.inserted_id), user, task_doc)

    task_id = str(result.inserted_id)
    task_doc["_id"] = result.inserted_id

    schedule_task_reminder(task_id, user, task_data.title, task_data.due_date or "Not specified", task_data.reminder)
    return serialize_task(task_doc)


@router.get("", response_model=List[TaskResponse])
async def get_tasks(
    request: Request,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
):
    user = await get_current_user(request)

    query = {"user_id": user["id"]}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    tasks = await db.tasks.find(query).to_list(1000)
    return [serialize_task(task) for task in tasks]


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, request: Request):
    user = await get_current_user(request)
    task = await db.tasks.find_one({"_id": ObjectId(task_id), "user_id": user["id"]})

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return serialize_task(task)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_data: TaskUpdate, request: Request):
    user = await get_current_user(request)
    task = await db.tasks.find_one({"_id": ObjectId(task_id), "user_id": user["id"]})

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_doc = {"updated_at": datetime.now(timezone.utc).isoformat()}
    for field in ["title", "description", "status", "priority", "category", "tags"]:
    for field in ["title", "description", "status", "priority", "due_date", "category", "tags", "reminder"]:
        value = getattr(task_data, field)
        if value is not None:
            update_doc[field] = value

    if task_data.due_at is not None or task_data.due_date is not None:
        due_at = parse_datetime_input(task_data.due_at or task_data.due_date)
        update_doc["due_at"] = due_at
        update_doc["due_date"] = to_iso(due_at)

    reminder_fields = {
        task_data.reminder_type,
        task_data.reminder,
        task_data.reminder_once_at,
        task_data.repeat_every_minutes,
        task_data.repeat_start_at,
        task_data.repeat_end_at,
    }
    if any(value is not None for value in reminder_fields):
        update_doc.update(normalize_reminders(task_data))
        remove_reminder_jobs(task_id)

    await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update_doc})
    updated_task = await db.tasks.find_one({"_id": ObjectId(task_id)})

    if any(value is not None for value in reminder_fields):
        schedule_task_reminders(task_id, user, updated_task)

    if task_data.reminder is not None:
        remove_reminder_job(task_id)
        schedule_task_reminder(
            task_id,
            user,
            task_data.title or task["title"],
            task_data.due_date or task.get("due_date") or "Not specified",
            task_data.reminder,
        )

    await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update_doc})
    updated_task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    return serialize_task(updated_task)


@router.delete("/{task_id}")
async def delete_task(task_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.tasks.delete_one({"_id": ObjectId(task_id), "user_id": user["id"]})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    remove_reminder_jobs(task_id)
    remove_reminder_job(task_id)
    return {"message": "Task deleted successfully"}


@router.patch("/{task_id}/status")
async def update_task_status(task_id: str, payload: StatusUpdate, request: Request):
    if payload.status not in ["todo", "in_progress", "done"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    user = await get_current_user(request)
    result = await db.tasks.update_one(
        {"_id": ObjectId(task_id), "user_id": user["id"]},
        {"$set": {"status": payload.status, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Status updated", "status": payload.status}
