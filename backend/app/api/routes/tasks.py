from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request

from app.core.database import db
from app.core.security import get_current_user
from app.models.schemas import StatusUpdate, TaskCreate, TaskResponse, TaskUpdate
from app.services.reminder_service import remove_reminder_job, schedule_task_reminder

router = APIRouter(prefix="/tasks", tags=["tasks"])


def serialize_task(task: dict) -> TaskResponse:
    return TaskResponse(
        id=str(task["_id"]),
        title=task["title"],
        description=task.get("description", ""),
        status=task["status"],
        priority=task["priority"],
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

    task_doc = {
        "title": task_data.title,
        "description": task_data.description or "",
        "status": task_data.status,
        "priority": task_data.priority,
        "due_date": task_data.due_date,
        "category": task_data.category,
        "tags": task_data.tags,
        "reminder": task_data.reminder,
        "user_id": user["id"],
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    result = await db.tasks.insert_one(task_doc)
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
    for field in ["title", "description", "status", "priority", "due_date", "category", "tags", "reminder"]:
        value = getattr(task_data, field)
        if value is not None:
            update_doc[field] = value

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
