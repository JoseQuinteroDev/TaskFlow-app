import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, categories, stats, tasks
from app.core.config import get_settings
from app.core.database import client, db
from app.services.reminder_service import shutdown_scheduler, start_scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(title="TaskFlow API")

api_prefix = "/api"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(tasks.router, prefix=api_prefix)
app.include_router(categories.router, prefix=api_prefix)
app.include_router(stats.router, prefix=api_prefix)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup() -> None:
    await db.users.create_index("email", unique=True)
    await db.tasks.create_index("user_id")
    await db.tasks.create_index("status")
    await db.categories.create_index("user_id")
    start_scheduler()
    logger.info("TaskFlow API started in %s mode", settings.ENVIRONMENT)


@app.on_event("shutdown")
async def shutdown() -> None:
    shutdown_scheduler()
    client.close()
    logger.info("TaskFlow API shutdown completed")
