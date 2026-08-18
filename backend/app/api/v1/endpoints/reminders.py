from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.core.database import get_db
from app.models.reminder import ReminderLog
from app.models.task import Task
from app.schemas.reminder_schema import ReminderLogResponse, AlertSummary
from app.services.alert_service import scan_and_generate_alerts

router = APIRouter(prefix="/reminders", tags=["Reminders & Alerts"])

@router.get("", response_model=List[ReminderLogResponse])
async def list_reminders(
    unacknowledged_only: bool = Query(True, description="Filter only unacknowledged alerts"),
    db: AsyncSession = Depends(get_db)
):
    query = select(ReminderLog)
    if unacknowledged_only:
        query = query.where(ReminderLog.is_acknowledged == False)
    query = query.order_by(ReminderLog.triggered_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/scan")
async def trigger_alert_scan(db: AsyncSession = Depends(get_db)):
    """Manually trigger background alert & overdue detector."""
    scan_results = await scan_and_generate_alerts(db)
    return {
        "status": "success",
        "message": "Overdue and reminder scan completed.",
        "results": scan_results
    }

@router.get("/summary", response_model=AlertSummary)
async def get_alert_summary(db: AsyncSession = Depends(get_db)):
    # 1. Total Overdue tasks
    overdue_stmt = select(func.count(Task.id)).where(Task.status == "OVERDUE")
    overdue_count = (await db.execute(overdue_stmt)).scalar() or 0

    # 2. Total Urgent Overdue/Pending
    urgent_stmt = select(func.count(Task.id)).where(
        and_(Task.priority == "URGENT", Task.status.in_(["PENDING", "IN_PROGRESS", "OVERDUE"]))
    )
    urgent_count = (await db.execute(urgent_stmt)).scalar() or 0

    # 3. Unacknowledged Reminder Logs
    unack_stmt = select(func.count(ReminderLog.id)).where(ReminderLog.is_acknowledged == False)
    unack_count = (await db.execute(unack_stmt)).scalar() or 0

    return AlertSummary(
        total_overdue=overdue_count,
        total_upcoming_today=0,
        urgent_alerts=urgent_count,
        unacknowledged_alerts=unack_count
    )

@router.post("/{reminder_id}/acknowledge", response_model=ReminderLogResponse)
async def acknowledge_reminder(
    reminder_id: int,
    db: AsyncSession = Depends(get_db)
):
    reminder = await db.get(ReminderLog, reminder_id)
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder log not found.")
    reminder.is_acknowledged = True
    reminder.acknowledged_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(reminder)
    return reminder

@router.post("/acknowledge-all")
async def acknowledge_all_reminders(db: AsyncSession = Depends(get_db)):
    stmt = select(ReminderLog).where(ReminderLog.is_acknowledged == False)
    result = await db.execute(stmt)
    unack_logs = result.scalars().all()
    now_utc = datetime.now(timezone.utc)
    for log in unack_logs:
        log.is_acknowledged = True
        log.acknowledged_at = now_utc
    await db.commit()
    return {"status": "success", "acknowledged_count": len(unack_logs)}
