from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.teams import router as teams_router
from app.api.v1.equipment import router as equipment_router
from app.api.v1.requests import router as requests_router
from app.api.v1.public import router as public_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(teams_router, prefix="/teams", tags=["teams"])
api_router.include_router(equipment_router, prefix="/equipment", tags=["equipment"])
api_router.include_router(requests_router, prefix="/requests", tags=["requests"])
api_router.include_router(public_router, prefix="/public", tags=["public"])
