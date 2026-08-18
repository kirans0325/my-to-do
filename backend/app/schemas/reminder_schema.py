from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ReminderLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    triggered_at: datetime
    alert_type: str
    message: str
    is_acknowledged: bool
    acknowledged_at: Optional[datetime] = None

class AlertSummary(BaseModel):
    total_overdue: int
    total_upcoming_today: int
    urgent_alerts: int
    unacknowledged_alerts: int
