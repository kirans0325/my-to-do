from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
from typing import Optional
from app.models.task import Task

def calculate_next_due_date(task: Task, from_time: Optional[datetime] = None) -> Optional[datetime]:
    """
    Computes the next due date for a recurring task based on recurrence_type and interval.
    """
    if task.recurrence_type == "NONE":
        return None

    base_date = from_time or task.due_date or datetime.now(timezone.utc)
    interval = max(1, task.recurrence_interval or 1)

    if task.recurrence_type == "DAILY":
        next_date = base_date + relativedelta(days=interval)
    elif task.recurrence_type == "WEEKLY":
        next_date = base_date + relativedelta(weeks=interval)
    elif task.recurrence_type == "MONTHLY":
        next_date = base_date + relativedelta(months=interval)
        if task.recurrence_day_of_month:
            try:
                next_date = next_date.replace(day=min(task.recurrence_day_of_month, 28))
            except ValueError:
                pass
    elif task.recurrence_type == "YEARLY":
        next_date = base_date + relativedelta(years=interval)
        if task.recurrence_month_of_year and task.recurrence_day_of_month:
            try:
                next_date = next_date.replace(
                    month=task.recurrence_month_of_year,
                    day=min(task.recurrence_day_of_month, 28)
                )
            except ValueError:
                pass
    else:
        next_date = None

    return next_date

def advance_recurring_task(task: Task) -> bool:
    """
    Advances a recurring task to its next scheduled cycle when completed.
    Returns True if the task was advanced, False if it is a non-recurring one-time task.
    """
    if task.recurrence_type == "NONE":
        task.status = "COMPLETED"
        task.progress_percentage = 100
        task.completed_at = datetime.now(timezone.utc)
        return False

    # Calculate next due date
    now_utc = datetime.now(timezone.utc)
    next_due = calculate_next_due_date(task, from_time=task.due_date or now_utc)
    
    # Ensure next due date is in the future if previous one was in the past
    while next_due and next_due < now_utc:
        next_due = calculate_next_due_date(task, from_time=next_due)

    task.due_date = next_due
    task.status = "PENDING"
    task.progress_percentage = 0
    task.completed_at = None
    
    # Reset subtasks completion status if any
    if task.subtasks and isinstance(task.subtasks, list):
        reset_subtasks = []
        for st in task.subtasks:
            st_copy = dict(st)
            st_copy["completed"] = False
            reset_subtasks.append(st_copy)
        task.subtasks = reset_subtasks

    return True
