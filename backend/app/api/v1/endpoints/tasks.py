from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.task import Task
from app.models.progress import ProgressEntry
from app.schemas.task_schema import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    ProgressLogCreate
)
from app.services.recurrence_service import advance_recurring_task

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    recurrence_type: Optional[str] = Query(None, description="Filter by NONE, DAILY, WEEKLY, MONTHLY, YEARLY"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: PENDING, IN_PROGRESS, COMPLETED, OVERDUE"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    priority: Optional[str] = Query(None, description="Filter by priority: LOW, MEDIUM, HIGH, URGENT"),
    search: Optional[str] = Query(None, description="Search in title or description"),
    db: AsyncSession = Depends(get_db)
):
    query = select(Task).options(
        selectinload(Task.category),
        selectinload(Task.progress_entries)
    )
    
    conditions = []
    if recurrence_type:
        conditions.append(Task.recurrence_type == recurrence_type.upper())
    if status_filter:
        conditions.append(Task.status == status_filter.upper())
    if category_id:
        conditions.append(Task.category_id == category_id)
    if priority:
        conditions.append(Task.priority == priority.upper())
    if search:
        search_pattern = f"%{search}%"
        conditions.append(
            or_(
                Task.title.ilike(search_pattern),
                Task.description.ilike(search_pattern)
            )
        )
        
    if conditions:
        query = query.where(and_(*conditions))
        
    # Order by due_date ascending (nulls last), then priority
    query = query.order_by(Task.due_date.asc().nulls_last(), Task.id.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    db: AsyncSession = Depends(get_db)
):
    data = task_in.model_dump()
    # Convert subtasks to dict list if provided
    if data.get("subtasks"):
        data["subtasks"] = [st if isinstance(st, dict) else st.model_dump() for st in data["subtasks"]]
    
    task = Task(**data)
    db.add(task)
    await db.commit()
    
    # Reload with relationships
    stmt = select(Task).options(
        selectinload(Task.category),
        selectinload(Task.progress_entries)
    ).where(Task.id == task.id)
    result = await db.execute(stmt)
    return result.scalar_one()

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Task).options(
        selectinload(Task.category),
        selectinload(Task.progress_entries)
    ).where(Task.id == task_id)
    result = await db.execute(stmt)
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Task).options(
        selectinload(Task.category),
        selectinload(Task.progress_entries)
    ).where(Task.id == task_id)
    task = (await db.execute(stmt)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    update_data = task_in.model_dump(exclude_unset=True)
    if "subtasks" in update_data and update_data["subtasks"] is not None:
        update_data["subtasks"] = [st if isinstance(st, dict) else st.model_dump() for st in update_data["subtasks"]]

    for field, val in update_data.items():
        setattr(task, field, val)

    task.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(task)
    return task

@router.post("/{task_id}/progress", response_model=TaskResponse)
async def update_task_progress(
    task_id: int,
    progress_in: ProgressLogCreate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Task).options(
        selectinload(Task.category),
        selectinload(Task.progress_entries)
    ).where(Task.id == task_id)
    task = (await db.execute(stmt)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    task.progress_percentage = progress_in.progress_value
    if progress_in.progress_value >= 100:
        task.status = "COMPLETED"
        task.completed_at = datetime.now(timezone.utc)
    elif progress_in.progress_value > 0 and task.status in ["PENDING", "OVERDUE"]:
        task.status = "IN_PROGRESS"

    # Add Progress Entry Log
    entry = ProgressEntry(
        task_id=task.id,
        progress_value=progress_in.progress_value,
        note=progress_in.note,
        recorded_at=datetime.now(timezone.utc)
    )
    db.add(entry)
    task.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    # Reload task with newly logged progress entries
    stmt = select(Task).options(
        selectinload(Task.category),
        selectinload(Task.progress_entries)
    ).where(Task.id == task_id)
    return (await db.execute(stmt)).scalar_one()

@router.post("/{task_id}/complete", response_model=TaskResponse)
async def mark_task_complete(
    task_id: int,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Task).options(
        selectinload(Task.category),
        selectinload(Task.progress_entries)
    ).where(Task.id == task_id)
    task = (await db.execute(stmt)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    # Record 100% progress log
    entry = ProgressEntry(
        task_id=task.id,
        progress_value=100,
        note="Marked as completed",
        recorded_at=datetime.now(timezone.utc)
    )
    db.add(entry)

    # Handle recurrence advancement if applicable
    was_advanced = advance_recurring_task(task)
    if not was_advanced:
        task.status = "COMPLETED"
        task.progress_percentage = 100
        task.completed_at = datetime.now(timezone.utc)

    task.updated_at = datetime.now(timezone.utc)
    await db.commit()
    
    stmt = select(Task).options(
        selectinload(Task.category),
        selectinload(Task.progress_entries)
    ).where(Task.id == task_id)
    return (await db.execute(stmt)).scalar_one()

@router.post("/{task_id}/toggle-subtask/{subtask_id}", response_model=TaskResponse)
async def toggle_subtask(
    task_id: int,
    subtask_id: int,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Task).options(
        selectinload(Task.category),
        selectinload(Task.progress_entries)
    ).where(Task.id == task_id)
    task = (await db.execute(stmt)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    subtasks = task.subtasks or []
    updated = False
    for st in subtasks:
        if st.get("id") == subtask_id:
            st["completed"] = not st.get("completed", False)
            updated = True
            break

    if updated:
        task.subtasks = list(subtasks)
        # Recalculate progress percentage based on subtask ratio
        total_st = len(subtasks)
        completed_st = sum(1 for s in subtasks if s.get("completed"))
        if total_st > 0:
            task.progress_percentage = int((completed_st / total_st) * 100)
            if task.progress_percentage == 100 and task.recurrence_type == "NONE":
                task.status = "COMPLETED"
                task.completed_at = datetime.now(timezone.utc)
            elif task.progress_percentage > 0:
                task.status = "IN_PROGRESS"
                
        task.updated_at = datetime.now(timezone.utc)
        await db.commit()

    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db)
):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    await db.delete(task)
    await db.commit()
    return None
