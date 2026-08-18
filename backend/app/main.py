from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.core.scheduler import scheduler
from app.api.v1.api_router import api_router
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("taskflow.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database Tables
    logger.info("Initializing TaskFlow Pro Database...")
    await init_db()
    
    # Startup: Start Background Alert & Overdue Monitor
    scheduler.start()
    
    yield
    
    # Shutdown: Stop Background Scheduler
    await scheduler.stop()

app = FastAPI(
    title=settings.APP_NAME,
    description="Cross-platform Task, Reminder, Progress Monitor & Daily Activity Journal API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Web and Mobile frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "docs": "/docs",
        "database_type": "PostgreSQL (Neon)" if settings.is_postgres else "SQLite (Local)"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
