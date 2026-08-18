from typing import Dict, List, Optional
from pydantic import BaseModel

class FrequencyBreakdown(BaseModel):
    total: int
    completed: int
    overdue: int
    in_progress: int
    completion_rate: float

class CategoryBreakdown(BaseModel):
    category_id: Optional[int]
    category_name: str
    color: str
    total: int
    completed: int

class OverviewStatsResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    pending_tasks: int
    overdue_tasks: int
    overall_completion_rate: float
    current_streak_days: int
    
    # Breakdowns by Recurrence & Timeframe
    daily_stats: FrequencyBreakdown
    monthly_stats: FrequencyBreakdown
    yearly_stats: FrequencyBreakdown
    one_time_stats: FrequencyBreakdown
    
    # Breakdowns by Category
    categories: List[CategoryBreakdown]
    
    # Diary stats
    total_diary_entries: int
    average_productivity: float
