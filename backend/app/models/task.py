from datetime import datetime, timezone
from typing import Optional, List, Any
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Recurrence: NONE, DAILY, WEEKLY, MONTHLY, YEARLY
    recurrence_type: Mapped[str] = mapped_column(String(20), default="NONE", index=True)
    recurrence_interval: Mapped[int] = mapped_column(Integer, default=1)
    recurrence_day_of_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    recurrence_month_of_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Dates & Timers
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    reminder_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Priority: LOW, MEDIUM, HIGH, URGENT
    priority: Mapped[str] = mapped_column(String(20), default="MEDIUM", index=True)
    
    # Status: PENDING, IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)
    
    # Progress: 0 to 100
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)
    
    # Foreign Keys
    category_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    
    # Subtasks stored as JSON list: [{"id": 1, "title": "step 1", "completed": false}]
    subtasks: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True, default=list)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    category = relationship("Category", back_populates="tasks")
    reminders = relationship("ReminderLog", back_populates="task", cascade="all, delete-orphan", order_by="desc(ReminderLog.triggered_at)")
    progress_entries = relationship("ProgressEntry", back_populates="task", cascade="all, delete-orphan", order_by="desc(ProgressEntry.recorded_at)")
