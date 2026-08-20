from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.task import Task
from app.models.progress import ProgressEntry
from app.models.user import User
from app.core.security import get_current_user_optional
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
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    query = select(Task).options(
        selectinload(Task.category),
        selectinload(Task.progress_entries)
    )
    
    # Multi-user strict isolation
    if not current_user:
        return []

    conditions = [Task.user_id == current_user.id]
    
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
        
    query = query.where(and_(*conditions))
        
    # Order by due_date ascending (nulls last), then priority
    query = query.order_by(Task.due_date.asc().nulls_last(), Task.id.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    data = task_in.model_dump()
    # Convert subtasks to dict list if provided
    if data.get("subtasks"):
        data["subtasks"] = [st if isinstance(st, dict) else st.model_dump() for st in data["subtasks"]]
    
    task = Task(**data)
    if current_user:
        task.user_id = current_user.id

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
    current_user: Optional[User] = Depends(get_current_user_optional),
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
    
    user_id = current_user.id if current_user else None
    if task.user_id is not None and task.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Task access denied.")

    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_in: TaskUpdate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Task).options(
        selectinload(Task.category),
        selectinload(Task.progress_entries)
    ).where(Task.id == task_id)
    task = (await db.execute(stmt)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    user_id = current_user.id if current_user else None
    if task.user_id is not None and task.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Task modification denied.")

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
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Task).options(
        selectinload(Task.category),
        selectinload(Task.progress_entries)
    ).where(Task.id == task_id)
    task = (await db.execute(stmt)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    user_id = current_user.id if current_user else None
    if task.user_id is not None and task.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Task progress update denied.")

    task.progress_percentage = progress_in.progress_value
    if progress_in.progress_value >= 100:
        task.status = "COMPLETED"
        task.completed_at = datetime.now(timezone.utc)
    elif progress_in.progress_value > 0 and task.status == "PENDING":
        task.status = "IN_PROGRESS"

    # Log progress history entry
    log_entry = ProgressEntry(
        task_id=task.id,
        progress_value=progress_in.progress_value,
        note=progress_in.note
    )
    db.add(log_entry)

    task.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(task)
    return task

@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Task).options(
        selectinload(Task.category),
        selectinload(Task.progress_entries)
    ).where(Task.id == task_id)
    task = (await db.execute(stmt)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    user_id = current_user.id if current_user else None
    if task.user_id is not None and task.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Task completion denied.")

    # If it is a recurring task, calculate and advance next cycle
    if task.recurrence_type != "NONE":
        task = advance_recurring_task(task)
    else:
        task.status = "COMPLETED"
        task.progress_percentage = 100
        task.completed_at = datetime.now(timezone.utc)

    # Log completion progress
    log_entry = ProgressEntry(
        task_id=task.id,
        progress_value=100,
        note="Task marked completed (Cycle advanced if recurring)"
    )
    db.add(log_entry)

    task.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(task)
    return task

@router.post("/{task_id}/toggle-subtask/{subtask_id}", response_model=TaskResponse)
async def toggle_subtask(
    task_id: int,
    subtask_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Task).options(
        selectinload(Task.category),
        selectinload(Task.progress_entries)
    ).where(Task.id == task_id)
    task = (await db.execute(stmt)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    user_id = current_user.id if current_user else None
    if task.user_id is not None and task.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Subtask modification denied.")

    subtasks = task.subtasks or []
    updated = False
    for st in subtasks:
        if st.get("id") == subtask_id:
            st["completed"] = not st.get("completed", False)
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Subtask with id {subtask_id} not found.")

    task.subtasks = list(subtasks)
    
    # Auto recalculate progress based on subtasks
    completed_count = sum(1 for st in subtasks if st.get("completed"))
    total_count = len(subtasks)
    if total_count > 0:
        task.progress_percentage = int((completed_count / total_count) * 100)
        if task.progress_percentage >= 100:
            task.status = "COMPLETED"
            task.completed_at = datetime.now(timezone.utc)
        elif task.progress_percentage > 0 and task.status == "PENDING":
            task.status = "IN_PROGRESS"

    task.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Task).where(Task.id == task_id)
    task = (await db.execute(stmt)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    user_id = current_user.id if current_user else None
    if task.user_id is not None and task.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Task deletion denied.")

    await db.delete(task)
    await db.commit()
    return None

class SnoozeInput(BaseModel):
    minutes: int = Field(default=15, ge=1, le=1440)

@router.post("/{task_id}/snooze", response_model=TaskResponse)
async def snooze_task(
    task_id: int,
    payload: SnoozeInput = SnoozeInput(),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Snooze task alarm/due_date by N minutes."""
    stmt = select(Task).options(
        selectinload(Task.category),
        selectinload(Task.progress_entries)
    ).where(Task.id == task_id)
    task = (await db.execute(stmt)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    user_id = current_user.id if current_user else None
    if task.user_id is not None and task.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Task snooze denied.")

    from datetime import timedelta
    now_utc = datetime.now(timezone.utc)
    base_time = task.due_date if (task.due_date and task.due_date > now_utc) else now_utc
    task.due_date = base_time + timedelta(minutes=payload.minutes)
    
    # If status was overdue, revert to in_progress/pending
    if task.status == "OVERDUE":
        task.status = "IN_PROGRESS" if task.progress_percentage > 0 else "PENDING"

    task.updated_at = now_utc
    await db.commit()
    await db.refresh(task)
    return task
