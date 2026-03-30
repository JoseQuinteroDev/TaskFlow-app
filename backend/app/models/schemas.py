from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field, model_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str


class ReminderConfigMixin(BaseModel):
    reminder_type: Literal["none", "once", "recurring"] = "none"
    reminder: Optional[str] = None  # legacy compatibility
    reminder_once_at: Optional[datetime] = None
    repeat_every_minutes: Optional[int] = Field(default=None, ge=5, le=1440)
    repeat_start_at: Optional[datetime] = None
    repeat_end_at: Optional[datetime] = None

    @model_validator(mode="after")
    def validate_reminder(self):
        if self.reminder_type == "none":
            return self

        if self.reminder_type == "once":
            if not self.reminder_once_at and not self.reminder:
                raise ValueError("reminder_once_at is required when reminder_type is 'once'")
            return self

        if self.reminder_type == "recurring":
            if not self.repeat_every_minutes:
                raise ValueError("repeat_every_minutes is required for recurring reminders")
            if not self.repeat_start_at or not self.repeat_end_at:
                raise ValueError("repeat_start_at and repeat_end_at are required for recurring reminders")
            if self.repeat_end_at <= self.repeat_start_at:
                raise ValueError("repeat_end_at must be greater than repeat_start_at")
        return self


class TaskCreate(ReminderConfigMixin):
    title: str
    description: Optional[str] = ""
    status: str = "todo"
    priority: str = "medium"
    due_date: Optional[str] = None  # legacy compatibility
    due_at: Optional[datetime] = None
    category: Optional[str] = None
    tags: List[str] = []


class TaskUpdate(ReminderConfigMixin):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None  # legacy compatibility
    due_at: Optional[datetime] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None


class TaskResponse(BaseModel):
    id: str
    title: str
    description: str
    status: str
    priority: str
    due_date: Optional[str]
    due_at: Optional[str]
    category: Optional[str]
    tags: List[str]
    reminder: Optional[str]
    reminder_type: Literal["none", "once", "recurring"]
    reminder_once_at: Optional[str]
    repeat_every_minutes: Optional[int]
    repeat_start_at: Optional[str]
    repeat_end_at: Optional[str]
    user_id: str
    created_at: str
    updated_at: str


class CategoryCreate(BaseModel):
    name: str
    color: str = "#71717A"


class CategoryResponse(BaseModel):
    id: str
    name: str
    color: str
    user_id: str


class StatusUpdate(BaseModel):
    status: str
