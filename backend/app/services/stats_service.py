from datetime import datetime, timezone, timedelta, date
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.task import Task
from app.models.category import Category
from app.models.diary import DiaryEntry
from app.schemas.stats_schema import (
    OverviewStatsResponse,
    FrequencyBreakdown,
    CategoryBreakdown
)

async def calculate_overview_stats(db: AsyncSession) -> OverviewStatsResponse:
    # 1. Fetch all tasks
    tasks_stmt = select(Task)
    tasks_res = await db.execute(tasks_stmt)
    all_tasks: List[Task] = list(tasks_res.scalars().all())

    total = len(all_tasks)
    completed = sum(1 for t in all_tasks if t.status == "COMPLETED")
    in_progress = sum(1 for t in all_tasks if t.status == "IN_PROGRESS")
    pending = sum(1 for t in all_tasks if t.status == "PENDING")
    overdue = sum(1 for t in all_tasks if t.status == "OVERDUE")

    completion_rate = round((completed / total * 100.0), 1) if total > 0 else 0.0

    # 2. Recurrence Breakdown Helper
    def build_frequency_stats(rec_types: List[str]) -> FrequencyBreakdown:
        sub_tasks = [t for t in all_tasks if t.recurrence_type in rec_types]
        sub_total = len(sub_tasks)
        sub_comp = sum(1 for t in sub_tasks if t.status == "COMPLETED")
        sub_over = sum(1 for t in sub_tasks if t.status == "OVERDUE")
        sub_in_prog = sum(1 for t in sub_tasks if t.status == "IN_PROGRESS")
        sub_rate = round((sub_comp / sub_total * 100.0), 1) if sub_total > 0 else 0.0
        return FrequencyBreakdown(
            total=sub_total,
            completed=sub_comp,
            overdue=sub_over,
            in_progress=sub_in_prog,
            completion_rate=sub_rate
        )

    daily_stats = build_frequency_stats(["DAILY", "WEEKLY"])
    monthly_stats = build_frequency_stats(["MONTHLY"])
    yearly_stats = build_frequency_stats(["YEARLY"])
    one_time_stats = build_frequency_stats(["NONE"])

    # 3. Category Breakdown
    cats_stmt = select(Category)
    cats_res = await db.execute(cats_stmt)
    categories = list(cats_res.scalars().all())

    cat_breakdowns: List[CategoryBreakdown] = []
    for cat in categories:
        cat_tasks = [t for t in all_tasks if t.category_id == cat.id]
        cat_total = len(cat_tasks)
        cat_comp = sum(1 for t in cat_tasks if t.status == "COMPLETED")
        cat_breakdowns.append(
            CategoryBreakdown(
                category_id=cat.id,
                category_name=cat.name,
                color=cat.color,
                total=cat_total,
                completed=cat_comp
            )
        )

    # 4. Streak Calculation
    # Check consecutive past days that had either completed tasks or diary entries
    diary_stmt = select(DiaryEntry.entry_date).order_by(DiaryEntry.entry_date.desc())
    diary_dates_res = await db.execute(diary_stmt)
    diary_dates = set(diary_dates_res.scalars().all())

    completed_task_dates = set()
    for t in all_tasks:
        if t.completed_at:
            completed_task_dates.add(t.completed_at.date())

    active_dates = diary_dates.union(completed_task_dates)

    streak_days = 0
    today = date.today()
    check_day = today

    # If today had activity, start streak from today; otherwise check yesterday
    if check_day in active_dates:
        streak_days += 1
        check_day -= timedelta(days=1)
    else:
        # Check if yesterday had activity
        yesterday = today - timedelta(days=1)
        if yesterday in active_dates:
            check_day = yesterday
        else:
            check_day = None

    while check_day and check_day in active_dates:
        streak_days += 1
        check_day -= timedelta(days=1)

    # 5. Diary Metrics
    diary_all_stmt = select(DiaryEntry)
    diary_all = list((await db.execute(diary_all_stmt)).scalars().all())
    total_diary = len(diary_all)
    avg_prod = (
        round(sum(d.productivity_score for d in diary_all) / total_diary, 1)
        if total_diary > 0
        else 0.0
    )

    return OverviewStatsResponse(
        total_tasks=total,
        completed_tasks=completed,
        in_progress_tasks=in_progress,
        pending_tasks=pending,
        overdue_tasks=overdue,
        overall_completion_rate=completion_rate,
        current_streak_days=streak_days,
        daily_stats=daily_stats,
        monthly_stats=monthly_stats,
        yearly_stats=yearly_stats,
        one_time_stats=one_time_stats,
        categories=cat_breakdowns,
        total_diary_entries=total_diary,
        average_productivity=avg_prod
    )
