from datetime import datetime, timezone

import jwt
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request, Response

from app.core.config import get_settings
from app.core.database import db
from app.core.security import (
    JWT_ALGORITHM,
    create_access_token,
    create_refresh_token,
    get_cookie_settings,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models.schemas import UserCreate, UserLogin, UserResponse
from app.services.email_service import send_email

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    user_doc = {
        "email": email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    cookie_settings = get_cookie_settings()
    response.set_cookie("access_token", create_access_token(user_id, email), max_age=3600, **cookie_settings)
    response.set_cookie("refresh_token", create_refresh_token(user_id), max_age=604800, **cookie_settings)

    return UserResponse(id=user_id, email=email, name=user_data.name, created_at=user_doc["created_at"])


@router.post("/login", response_model=UserResponse)
async def login(user_data: UserLogin, response: Response):
    email = user_data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    cookie_settings = get_cookie_settings()
    response.set_cookie("access_token", create_access_token(user_id, email), max_age=3600, **cookie_settings)
    response.set_cookie("refresh_token", create_refresh_token(user_id), max_age=604800, **cookie_settings)

    return UserResponse(id=user_id, email=user["email"], name=user["name"], created_at=user["created_at"])


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(request: Request):
    return await get_current_user(request)


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    refresh = request.cookies.get("refresh_token")
    if not refresh:
        raise HTTPException(status_code=401, detail="Refresh token not found")

    try:
        payload = jwt.decode(refresh, settings.JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        cookie_settings = get_cookie_settings()
        response.set_cookie(
            "access_token",
            create_access_token(str(user["_id"]), user["email"]),
            max_age=3600,
            **cookie_settings,
        )
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Refresh token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from exc


@router.post("/test-email")
async def test_email(request: Request):
    user = await get_current_user(request)
    success = send_email(
        user["email"],
        "Test - TaskFlow",
        f"<h1>Hello {user['name']}</h1><p>This is a test email from TaskFlow.</p>",
    )
    return {"success": success}
