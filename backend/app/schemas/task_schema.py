from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.category_schema import CategoryResponse

class SubtaskItem(BaseModel):
    id: int
    title: str
    completed: bool = False

class ProgressLogCreate(BaseModel):
    progress_value: int = Field(..., ge=0, le=100)
    note: Optional[str] = None

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    
    # Recurrence: NONE, DAILY, WEEKLY, MONTHLY, YEARLY
    recurrence_type: str = Field(default="NONE", pattern="^(NONE|DAILY|WEEKLY|MONTHLY|YEARLY)$")
    recurrence_interval: int = Field(default=1, ge=1)
    recurrence_day_of_month: Optional[int] = Field(default=None, ge=1, le=31)
    recurrence_month_of_year: Optional[int] = Field(default=None, ge=1, le=12)
    
    due_date: Optional[datetime] = None
    reminder_time: Optional[datetime] = None
    
    # Priority: LOW, MEDIUM, HIGH, URGENT
    priority: str = Field(default="MEDIUM", pattern="^(LOW|MEDIUM|HIGH|URGENT)$")
    
    # Status: PENDING, IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED
    status: str = Field(default="PENDING", pattern="^(PENDING|IN_PROGRESS|COMPLETED|OVERDUE|CANCELLED)$")
    progress_percentage: int = Field(default=0, ge=0, le=100)
    
    category_id: Optional[int] = None
    subtasks: Optional[List[SubtaskItem]] = Field(default_factory=list)

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    recurrence_type: Optional[str] = Field(default=None, pattern="^(NONE|DAILY|WEEKLY|MONTHLY|YEARLY)$")
    recurrence_interval: Optional[int] = Field(default=None, ge=1)
    recurrence_day_of_month: Optional[int] = Field(default=None, ge=1, le=31)
    recurrence_month_of_year: Optional[int] = Field(default=None, ge=1, le=12)
    due_date: Optional[datetime] = None
    reminder_time: Optional[datetime] = None
    priority: Optional[str] = Field(default=None, pattern="^(LOW|MEDIUM|HIGH|URGENT)$")
    status: Optional[str] = Field(default=None, pattern="^(PENDING|IN_PROGRESS|COMPLETED|OVERDUE|CANCELLED)$")
    progress_percentage: Optional[int] = Field(default=None, ge=0, le=100)
    category_id: Optional[int] = None
    subtasks: Optional[List[SubtaskItem]] = None

class ProgressEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    task_id: int
    progress_value: int
    note: Optional[str] = None
    recorded_at: datetime

class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None
    progress_entries: Optional[List[ProgressEntryResponse]] = Field(default_factory=list)
