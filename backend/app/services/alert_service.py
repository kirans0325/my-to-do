from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from app.models.task import Task
from app.models.reminder import ReminderLog
import logging

logger = logging.getLogger("taskflow.alerts")

async def scan_and_generate_alerts(db: AsyncSession) -> Dict[str, int]:
    """
    Evaluates all active tasks against current time, marks overdue tasks,
    and creates new reminder logs for due/overdue items.
    """
    now_utc = datetime.now(timezone.utc)
    new_overdue_count = 0
    new_reminders_count = 0

    # 1. Detect Overdue Tasks
    # Tasks with due_date in the past that are not completed or cancelled
    overdue_stmt = select(Task).where(
        and_(
            Task.due_date.is_not(None),
            Task.due_date < now_utc,
            Task.status.notin_(["COMPLETED", "CANCELLED"])
        )
    )
    overdue_result = await db.execute(overdue_stmt)
    overdue_tasks = overdue_result.scalars().all()

    for task in overdue_tasks:
        if task.status != "OVERDUE":
            task.status = "OVERDUE"
            new_overdue_count += 1

        # Check if an unacknowledged overdue reminder log already exists for this task
        existing_log_stmt = select(ReminderLog).where(
            and_(
                ReminderLog.task_id == task.id,
                ReminderLog.alert_type == "OVERDUE",
                ReminderLog.is_acknowledged == False
            )
        )
        existing_log = (await db.execute(existing_log_stmt)).scalar_one_or_none()

        if not existing_log:
            time_diff = now_utc - (task.due_date if task.due_date.tzinfo else task.due_date.replace(tzinfo=timezone.utc))
            hours_overdue = int(time_diff.total_seconds() // 3600)
            overdue_msg = f"Task '{task.title}' is overdue by {hours_overdue} hour(s)!" if hours_overdue > 0 else f"Task '{task.title}' is overdue!"
            
            reminder = ReminderLog(
                task_id=task.id,
                triggered_at=now_utc,
                alert_type="OVERDUE",
                message=overdue_msg,
                is_acknowledged=False
            )
            db.add(reminder)
            new_reminders_count += 1

    # 2. Detect Upcoming Reminders
    # Tasks where reminder_time has passed or is within next 15 minutes, but task is not yet completed
    upcoming_stmt = select(Task).where(
        and_(
            Task.reminder_time.is_not(None),
            Task.reminder_time <= (now_utc + timedelta(minutes=15)),
            Task.status.notin_(["COMPLETED", "CANCELLED", "OVERDUE"])
        )
    )
    upcoming_tasks = (await db.execute(upcoming_stmt)).scalars().all()

    for task in upcoming_tasks:
        existing_log_stmt = select(ReminderLog).where(
            and_(
                ReminderLog.task_id == task.id,
                ReminderLog.alert_type.in_(["UPCOMING", "DUE_NOW"]),
                ReminderLog.is_acknowledged == False
            )
        )
        existing_log = (await db.execute(existing_log_stmt)).scalar_one_or_none()

        if not existing_log:
            reminder = ReminderLog(
                task_id=task.id,
                triggered_at=now_utc,
                alert_type="UPCOMING",
                message=f"Reminder: '{task.title}' is scheduled for {task.due_date.strftime('%Y-%m-%d %H:%M') if task.due_date else 'soon'}.",
                is_acknowledged=False
            )
            db.add(reminder)
            new_reminders_count += 1

    await db.commit()
    logger.info(f"Alert scan completed: {new_overdue_count} overdue status updates, {new_reminders_count} new alerts logged.")
    return {
        "new_overdue_count": new_overdue_count,
        "new_reminders_count": new_reminders_count
    }
