from fastapi import APIRouter
from app.api.v1.endpoints.tasks import router as tasks_router
from app.api.v1.endpoints.categories import router as categories_router
from app.api.v1.endpoints.reminders import router as reminders_router
from app.api.v1.endpoints.diary import router as diary_router
from app.api.v1.endpoints.stats import router as stats_router
from app.api.v1.endpoints.auth import router as auth_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(tasks_router)
api_router.include_router(categories_router)
api_router.include_router(reminders_router)
api_router.include_router(diary_router)
api_router.include_router(stats_router)
