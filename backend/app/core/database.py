from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine
)
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
import logging

logger = logging.getLogger("taskflow.database")

# Build engine arguments based on DB type
connect_args = {}
engine_kwargs = {
    "echo": False,
    "future": True,
}

if settings.is_sqlite:
    connect_args["check_same_thread"] = False
    engine_kwargs["connect_args"] = connect_args
elif settings.is_postgres:
    # Neon PostgreSQL connection pool settings
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_pre_ping"] = True

engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for injecting database session into API routes."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    """Create all database tables asynchronously on startup."""
    # Import all models so metadata knows them
    import app.models  # noqa
    from sqlalchemy import text

    logger.info(f"Initializing database schema on: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Safe PostgreSQL / SQLite column migrations for multi-user user_id
        try:
            if settings.is_postgres:
                await conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;"))
                await conn.execute(text("ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;"))
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;"))
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;"))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_user_id ON tasks(user_id);"))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_diary_user_id ON diary_entries(user_id);"))
                # Drop old single-column unique index on entry_date if present to allow multiple users per date
                await conn.execute(text("DROP INDEX IF EXISTS ix_diary_entries_entry_date;"))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_diary_entries_entry_date ON diary_entries(entry_date);"))
            elif settings.is_sqlite:
                # SQLite fallback
                try:
                    await conn.execute(text("ALTER TABLE tasks ADD COLUMN user_id INTEGER;"))
                except Exception:
                    pass
                try:
                    await conn.execute(text("ALTER TABLE diary_entries ADD COLUMN user_id INTEGER;"))
                except Exception:
                    pass
                try:
                    await conn.execute(text("ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0;"))
                except Exception:
                    pass
                try:
                    await conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;"))
                except Exception:
                    pass
        except Exception as e:
            logger.warning(f"Column migration warning (safe to ignore if columns exist): {e}")

    logger.info("Database schema initialized successfully.")
