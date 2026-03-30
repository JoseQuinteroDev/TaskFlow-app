from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, BackgroundTasks
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from apscheduler.schedulers.asyncio import AsyncIOScheduler

ROOT_DIR = Path(__file__).parent

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"

# SendGrid Configuration
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "noreply@taskflow.app")

# Create the main app
app = FastAPI(title="TaskFlow API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Scheduler for reminders
scheduler = AsyncIOScheduler()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

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
    status: str = "todo"  # todo, in_progress, done
    priority: str = "medium"  # low, medium, high
    due_date: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    reminder: Optional[str] = None  # ISO datetime string

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

# ==================== PASSWORD HELPERS ====================

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# ==================== JWT HELPERS ====================

def get_jwt_secret() -> str:
    return JWT_SECRET

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "created_at": user["created_at"]
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== EMAIL HELPERS ====================

def send_email(to: str, subject: str, content: str):
    if not SENDGRID_API_KEY:
        logger.warning("SendGrid API key not configured, skipping email")
        return False
    try:
        message = Mail(
            from_email=SENDER_EMAIL,
            to_emails=to,
            subject=subject,
            html_content=content
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        logger.info(f"Email sent to {to}, status: {response.status_code}")
        return response.status_code == 202
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False

def send_task_reminder(user_email: str, user_name: str, task_title: str, due_date: str):
    subject = f"Recordatorio: {task_title}"
    content = f"""
    <html>
    <body style="font-family: 'Inter', sans-serif; background-color: #09090B; color: #FAFAFA; padding: 40px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #18181B; border-radius: 8px; padding: 32px; border: 1px solid #27272A;">
            <h2 style="font-family: 'Manrope', sans-serif; margin-bottom: 24px; color: #FAFAFA;">Hola {user_name},</h2>
            <p style="color: #A1A1AA; margin-bottom: 16px;">Este es un recordatorio de tu tarea:</p>
            <div style="background-color: #27272A; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                <h3 style="color: #FAFAFA; margin: 0 0 8px 0;">{task_title}</h3>
                <p style="color: #71717A; margin: 0;">Fecha limite: {due_date}</p>
            </div>
            <p style="color: #71717A; font-size: 14px;">- TaskFlow</p>
        </div>
    </body>
    </html>
    """
    return send_email(user_email, subject, content)

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(user_data.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": user_data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user_data.name, "created_at": user_doc["created_at"]}

@api_router.post("/auth/login")
async def login(user_data: UserLogin, response: Response):
    email = user_data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": user["email"], "name": user["name"], "created_at": user["created_at"]}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    refresh = request.cookies.get("refresh_token")
    if not refresh:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(refresh, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ==================== TASK ENDPOINTS ====================

@api_router.post("/tasks", response_model=TaskResponse)
async def create_task(task_data: TaskCreate, request: Request, background_tasks: BackgroundTasks):
    user = await get_current_user(request)
    
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
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.tasks.insert_one(task_doc)
    task_id = str(result.inserted_id)
    
    # Schedule reminder if set
    if task_data.reminder and SENDGRID_API_KEY:
        try:
            reminder_time = datetime.fromisoformat(task_data.reminder.replace('Z', '+00:00'))
            if reminder_time > datetime.now(timezone.utc):
                scheduler.add_job(
                    send_task_reminder,
                    'date',
                    run_date=reminder_time,
                    args=[user["email"], user["name"], task_data.title, task_data.due_date or "No especificada"],
                    id=f"reminder_{task_id}"
                )
        except Exception as e:
            logger.error(f"Failed to schedule reminder: {e}")
    
    return TaskResponse(
        id=task_id,
        title=task_doc["title"],
        description=task_doc["description"],
        status=task_doc["status"],
        priority=task_doc["priority"],
        due_date=task_doc["due_date"],
        category=task_doc["category"],
        tags=task_doc["tags"],
        reminder=task_doc["reminder"],
        user_id=task_doc["user_id"],
        created_at=task_doc["created_at"],
        updated_at=task_doc["updated_at"]
    )

@api_router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(request: Request, status: Optional[str] = None, priority: Optional[str] = None, category: Optional[str] = None, search: Optional[str] = None):
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
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    tasks = await db.tasks.find(query, {"_id": 1, "title": 1, "description": 1, "status": 1, "priority": 1, "due_date": 1, "category": 1, "tags": 1, "reminder": 1, "user_id": 1, "created_at": 1, "updated_at": 1}).to_list(1000)
    
    return [TaskResponse(
        id=str(t["_id"]),
        title=t["title"],
        description=t.get("description", ""),
        status=t["status"],
        priority=t["priority"],
        due_date=t.get("due_date"),
        category=t.get("category"),
        tags=t.get("tags", []),
        reminder=t.get("reminder"),
        user_id=t["user_id"],
        created_at=t["created_at"],
        updated_at=t["updated_at"]
    ) for t in tasks]

@api_router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, request: Request):
    user = await get_current_user(request)
    
    task = await db.tasks.find_one({"_id": ObjectId(task_id), "user_id": user["id"]})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
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
        updated_at=task["updated_at"]
    )

@api_router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_data: TaskUpdate, request: Request):
    user = await get_current_user(request)
    
    task = await db.tasks.find_one({"_id": ObjectId(task_id), "user_id": user["id"]})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_doc = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if task_data.title is not None:
        update_doc["title"] = task_data.title
    if task_data.description is not None:
        update_doc["description"] = task_data.description
    if task_data.status is not None:
        update_doc["status"] = task_data.status
    if task_data.priority is not None:
        update_doc["priority"] = task_data.priority
    if task_data.due_date is not None:
        update_doc["due_date"] = task_data.due_date
    if task_data.category is not None:
        update_doc["category"] = task_data.category
    if task_data.tags is not None:
        update_doc["tags"] = task_data.tags
    if task_data.reminder is not None:
        update_doc["reminder"] = task_data.reminder
        # Update reminder job
        try:
            scheduler.remove_job(f"reminder_{task_id}")
        except:
            pass
        if task_data.reminder and SENDGRID_API_KEY:
            try:
                reminder_time = datetime.fromisoformat(task_data.reminder.replace('Z', '+00:00'))
                if reminder_time > datetime.now(timezone.utc):
                    scheduler.add_job(
                        send_task_reminder,
                        'date',
                        run_date=reminder_time,
                        args=[user["email"], user["name"], task_data.title or task["title"], task_data.due_date or task.get("due_date") or "No especificada"],
                        id=f"reminder_{task_id}"
                    )
            except Exception as e:
                logger.error(f"Failed to schedule reminder: {e}")
    
    await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update_doc})
    
    updated_task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    
    return TaskResponse(
        id=str(updated_task["_id"]),
        title=updated_task["title"],
        description=updated_task.get("description", ""),
        status=updated_task["status"],
        priority=updated_task["priority"],
        due_date=updated_task.get("due_date"),
        category=updated_task.get("category"),
        tags=updated_task.get("tags", []),
        reminder=updated_task.get("reminder"),
        user_id=updated_task["user_id"],
        created_at=updated_task["created_at"],
        updated_at=updated_task["updated_at"]
    )

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, request: Request):
    user = await get_current_user(request)
    
    result = await db.tasks.delete_one({"_id": ObjectId(task_id), "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Remove reminder job if exists
    try:
        scheduler.remove_job(f"reminder_{task_id}")
    except:
        pass
    
    return {"message": "Task deleted successfully"}

@api_router.patch("/tasks/{task_id}/status")
async def update_task_status(task_id: str, request: Request):
    user = await get_current_user(request)
    body = await request.json()
    new_status = body.get("status")
    
    if new_status not in ["todo", "in_progress", "done"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.tasks.update_one(
        {"_id": ObjectId(task_id), "user_id": user["id"]},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Status updated", "status": new_status}

# ==================== CATEGORY ENDPOINTS ====================

@api_router.post("/categories", response_model=CategoryResponse)
async def create_category(category_data: CategoryCreate, request: Request):
    user = await get_current_user(request)
    
    category_doc = {
        "name": category_data.name,
        "color": category_data.color,
        "user_id": user["id"]
    }
    
    result = await db.categories.insert_one(category_doc)
    
    return CategoryResponse(
        id=str(result.inserted_id),
        name=category_doc["name"],
        color=category_doc["color"],
        user_id=category_doc["user_id"]
    )

@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(request: Request):
    user = await get_current_user(request)
    
    categories = await db.categories.find({"user_id": user["id"]}).to_list(100)
    
    return [CategoryResponse(
        id=str(c["_id"]),
        name=c["name"],
        color=c["color"],
        user_id=c["user_id"]
    ) for c in categories]

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, request: Request):
    user = await get_current_user(request)
    
    result = await db.categories.delete_one({"_id": ObjectId(category_id), "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted successfully"}

# ==================== STATS ENDPOINT ====================

@api_router.get("/stats")
async def get_stats(request: Request):
    user = await get_current_user(request)
    
    total = await db.tasks.count_documents({"user_id": user["id"]})
    todo = await db.tasks.count_documents({"user_id": user["id"], "status": "todo"})
    in_progress = await db.tasks.count_documents({"user_id": user["id"], "status": "in_progress"})
    done = await db.tasks.count_documents({"user_id": user["id"], "status": "done"})
    
    high_priority = await db.tasks.count_documents({"user_id": user["id"], "priority": "high", "status": {"$ne": "done"}})
    
    # Tasks due today
    today = datetime.now(timezone.utc).date().isoformat()
    due_today = await db.tasks.count_documents({
        "user_id": user["id"],
        "due_date": {"$regex": f"^{today}"},
        "status": {"$ne": "done"}
    })
    
    # Overdue tasks
    overdue = await db.tasks.count_documents({
        "user_id": user["id"],
        "due_date": {"$lt": today},
        "status": {"$ne": "done"}
    })
    
    return {
        "total": total,
        "todo": todo,
        "in_progress": in_progress,
        "done": done,
        "high_priority": high_priority,
        "due_today": due_today,
        "overdue": overdue,
        "completion_rate": round((done / total * 100) if total > 0 else 0, 1)
    }

# ==================== REMINDER TEST ENDPOINT ====================

@api_router.post("/test-email")
async def test_email(request: Request):
    user = await get_current_user(request)
    success = send_email(
        user["email"],
        "Test - TaskFlow",
        f"<h1>Hola {user['name']}</h1><p>Este es un email de prueba de TaskFlow.</p>"
    )
    return {"success": success}

# Include the router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get('FRONTEND_URL', 'http://localhost:3000')],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup and shutdown events
@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.tasks.create_index("user_id")
    await db.tasks.create_index("status")
    await db.categories.create_index("user_id")
    
    # Start scheduler
    scheduler.start()
    logger.info("Application started, scheduler running")

@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()
    client.close()
    logger.info("Application shutdown")
