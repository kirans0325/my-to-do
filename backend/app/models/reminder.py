from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class ReminderLog(Base):
    __tablename__ = "reminder_logs"
    __table_args__ = (
        Index("ix_reminder_task_ack", "task_id", "is_acknowledged"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    triggered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True
    )
    # Alert Type: UPCOMING, DUE_NOW, OVERDUE, PROGRESS_NUDGE
    alert_type: Mapped[str] = mapped_column(String(30), default="OVERDUE")
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    is_acknowledged: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    task = relationship("Task", back_populates="reminders")
