from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

    APP_NAME: str = "TaskFlow Pro API"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    
    # Dual-Database URL (SQLite or Neon Postgres)
    DATABASE_URL: str = "sqlite+aiosqlite:///./local_tasks.db"
    
    # CORS Origins (support web browser frontend and mobile)
    CORS_ORIGINS: Union[List[str], str] = ["*"]
    
    # Alert check interval in seconds for background task
    ALERT_CHECK_INTERVAL_SECONDS: int = 60

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if not v:
            return "sqlite+aiosqlite:///./local_tasks.db"
        
        # If user provides standard postgresql:// URL (like from Neon dashboard),
        # convert it to postgresql+asyncpg:// for async SQLAlchemy
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif v.startswith("sqlite:///") and not v.startswith("sqlite+aiosqlite:///"):
            v = v.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
            
        # Asyncpg uses ssl=require instead of sslmode=require
        if "sslmode=require" in v:
            v = v.replace("sslmode=require", "ssl=require")
        if "&channel_binding=require" in v:
            v = v.replace("&channel_binding=require", "")
            
        return v

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.DATABASE_URL

    @property
    def is_postgres(self) -> bool:
        return "postgres" in self.DATABASE_URL


settings = Settings()
