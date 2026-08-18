from datetime import date, datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict

class DailyActivityItem(BaseModel):
    time: str = Field(..., description="Time of activity, e.g. '09:00 AM'")
    activity: str = Field(..., description="Activity description")
    category: Optional[str] = Field(default="General", description="Category or context")
    done: bool = Field(default=True, description="Whether completed")

class DiaryEntryBase(BaseModel):
    entry_date: date
    title: Optional[str] = Field(default=None, max_length=200)
    content: str = Field(..., description="Daily notes, reflections, journal entries")
    mood: str = Field(default="GOOD", pattern="^(GREAT|GOOD|NEUTRAL|TIRED|STRESSED)$")
    productivity_score: int = Field(default=7, ge=1, le=10)
    tags: Optional[str] = None
    activities: Optional[List[DailyActivityItem]] = Field(default_factory=list)

class DiaryEntryCreate(DiaryEntryBase):
    pass

class DiaryEntryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    mood: Optional[str] = Field(default=None, pattern="^(GREAT|GOOD|NEUTRAL|TIRED|STRESSED)$")
    productivity_score: Optional[int] = Field(default=None, ge=1, le=10)
    tags: Optional[str] = None
    activities: Optional[List[DailyActivityItem]] = None

class DiaryEntryResponse(DiaryEntryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
