from typing import List, Optional

from pydantic import BaseModel, EmailStr


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


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    status: str = "todo"
    priority: str = "medium"
    due_date: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    reminder: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    reminder: Optional[str] = None


class TaskResponse(BaseModel):
    id: str
    title: str
    description: str
    status: str
    priority: str
    due_date: Optional[str]
    category: Optional[str]
    tags: List[str]
    reminder: Optional[str]
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
