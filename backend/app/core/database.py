from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

settings = get_settings()
client = AsyncIOMotorClient(settings.MONGO_URL)
db: AsyncIOMotorDatabase = client[settings.DB_NAME]


def get_db() -> AsyncIOMotorDatabase:
    return db
