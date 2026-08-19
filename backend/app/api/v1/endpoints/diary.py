from typing import List, Optional
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.core.database import get_db
from app.models.diary import DiaryEntry
from app.models.user import User
from app.core.security import get_current_user_optional
from app.schemas.diary_schema import (
    DiaryEntryCreate,
    DiaryEntryUpdate,
    DiaryEntryResponse
)

router = APIRouter(prefix="/diary", tags=["Daily Diary & Activity Log"])

@router.get("", response_model=List[DiaryEntryResponse])
async def list_diary_entries(
    start_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    mood: Optional[str] = Query(None, description="Filter by mood: GREAT, GOOD, NEUTRAL, TIRED, STRESSED"),
    limit: int = Query(30, ge=1, le=365),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    query = select(DiaryEntry)
    conditions = []

    if current_user:
        conditions.append(or_(DiaryEntry.user_id == current_user.id, DiaryEntry.user_id == None))

    if start_date:
        conditions.append(DiaryEntry.entry_date >= start_date)
    if end_date:
        conditions.append(DiaryEntry.entry_date <= end_date)
    if mood:
        conditions.append(DiaryEntry.mood == mood.upper())
    
    if conditions:
        query = query.where(and_(*conditions))

    query = query.order_by(DiaryEntry.entry_date.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/date/{entry_date}", response_model=DiaryEntryResponse)
async def get_diary_by_date(
    entry_date: date,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    conditions = [DiaryEntry.entry_date == entry_date]
    if current_user:
        conditions.append(or_(DiaryEntry.user_id == current_user.id, DiaryEntry.user_id == None))

    stmt = select(DiaryEntry).where(and_(*conditions))
    entry = (await db.execute(stmt)).scalar_one_or_none()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No diary entry found for date {entry_date}."
        )
    return entry

@router.post("", response_model=DiaryEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_or_upsert_diary_entry(
    entry_in: DiaryEntryCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    # Check if entry for this date already exists for this user
    user_id = current_user.id if current_user else None
    conditions = [DiaryEntry.entry_date == entry_in.entry_date]
    if user_id:
        conditions.append(DiaryEntry.user_id == user_id)
    else:
        conditions.append(DiaryEntry.user_id == None)

    stmt = select(DiaryEntry).where(and_(*conditions))
    existing = (await db.execute(stmt)).scalar_one_or_none()

    data = entry_in.model_dump()
    if data.get("activities"):
        data["activities"] = [act if isinstance(act, dict) else act.model_dump() for act in data["activities"]]

    if existing:
        for field, val in data.items():
            setattr(existing, field, val)
        existing.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        new_entry = DiaryEntry(**data)
        new_entry.user_id = user_id
        db.add(new_entry)
        await db.commit()
        await db.refresh(new_entry)
        return new_entry

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_diary_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(DiaryEntry).where(DiaryEntry.id == entry_id)
    entry = (await db.execute(stmt)).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diary entry not found.")
    await db.delete(entry)
    await db.commit()
    return None
