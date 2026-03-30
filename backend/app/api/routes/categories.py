from typing import List

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request

from app.core.database import db
from app.core.security import get_current_user
from app.models.schemas import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("", response_model=CategoryResponse)
async def create_category(category_data: CategoryCreate, request: Request):
    user = await get_current_user(request)
    category_doc = {
        "name": category_data.name,
        "color": category_data.color,
        "user_id": user["id"],
    }
    result = await db.categories.insert_one(category_doc)

    return CategoryResponse(
        id=str(result.inserted_id),
        name=category_doc["name"],
        color=category_doc["color"],
        user_id=category_doc["user_id"],
    )


@router.get("", response_model=List[CategoryResponse])
async def get_categories(request: Request):
    user = await get_current_user(request)
    categories = await db.categories.find({"user_id": user["id"]}).to_list(100)

    return [
        CategoryResponse(
            id=str(category["_id"]),
            name=category["name"],
            color=category["color"],
            user_id=category["user_id"],
        )
        for category in categories
    ]


@router.delete("/{category_id}")
async def delete_category(category_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.categories.delete_one({"_id": ObjectId(category_id), "user_id": user["id"]})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")

    return {"message": "Category deleted successfully"}
