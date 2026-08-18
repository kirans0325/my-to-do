from datetime import datetime, date, timezone
from typing import Optional, Any
from sqlalchemy import Integer, String, Text, Date, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class DiaryEntry(Base):
    __tablename__ = "diary_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False, unique=True, index=True)
    title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Mood tracking: GREAT, GOOD, NEUTRAL, TIRED, STRESSED
    mood: Mapped[str] = mapped_column(String(20), default="GOOD")
    
    # Productivity score (1 to 10)
    productivity_score: Mapped[int] = mapped_column(Integer, default=7)
    
    # Comma-separated tags (e.g., "coding,workout,reading,meeting")
    tags: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Structured timeline of activities for the day
    # Example: [{"time": "09:00 AM", "activity": "FastAPI setup", "done": true}]
    activities: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True, default=list)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
