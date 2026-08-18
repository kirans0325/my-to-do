from typing import List, Optional
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.core.database import get_db
from app.models.diary import DiaryEntry
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
    db: AsyncSession = Depends(get_db)
):
    query = select(DiaryEntry)
    conditions = []
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
    db: AsyncSession = Depends(get_db)
):
    stmt = select(DiaryEntry).where(DiaryEntry.entry_date == entry_date)
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
    db: AsyncSession = Depends(get_db)
):
    # Check if entry for this date already exists
    stmt = select(DiaryEntry).where(DiaryEntry.entry_date == entry_in.entry_date)
    existing = (await db.execute(stmt)).scalar_one_or_none()

    data = entry_in.model_dump()
    if data.get("activities"):
        data["activities"] = [
            act if isinstance(act, dict) else act.model_dump() for act in data["activities"]
        ]

    if existing:
        # Update existing entry
        for key, value in data.items():
            setattr(existing, key, value)
        existing.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        # Create new entry
        entry = DiaryEntry(**data)
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return entry

@router.put("/{entry_id}", response_model=DiaryEntryResponse)
async def update_diary_entry(
    entry_id: int,
    entry_in: DiaryEntryUpdate,
    db: AsyncSession = Depends(get_db)
):
    entry = await db.get(DiaryEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diary entry not found.")

    update_data = entry_in.model_dump(exclude_unset=True)
    if "activities" in update_data and update_data["activities"] is not None:
        update_data["activities"] = [
            act if isinstance(act, dict) else act.model_dump() for act in update_data["activities"]
        ]

    for key, value in update_data.items():
        setattr(entry, key, value)

    entry.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(entry)
    return entry

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_diary_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db)
):
    entry = await db.get(DiaryEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diary entry not found.")
    await db.delete(entry)
    await db.commit()
    return None
