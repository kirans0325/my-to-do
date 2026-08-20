from typing import List, Dict, Tuple, Optional
from datetime import datetime, timezone, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case, distinct
from app.models.task import Task
from app.models.category import Category
from app.models.diary import DiaryEntry
from app.models.user import User
from app.schemas.stats_schema import (
    OverviewStatsResponse,
    FrequencyBreakdown,
    CategoryBreakdown
)

async def calculate_overview_stats(db: AsyncSession, current_user: Optional[User] = None) -> OverviewStatsResponse:
    """
    Highly optimized SQL-level statistical aggregation with minimal Python memory footprint.
    Performs grouping and count aggregations directly in the database engine with per-user filtering.
    """
    if current_user:
        task_user_cond = or_(Task.user_id == current_user.id, Task.user_id == None)
        diary_user_cond = or_(DiaryEntry.user_id == current_user.id, DiaryEntry.user_id == None)
    else:
        task_user_cond = (Task.user_id == None)
        diary_user_cond = (DiaryEntry.user_id == None)

    # 1. Aggregate Task Statuses and Recurrences in a single SQL query
    status_stmt = select(
        Task.recurrence_type,
        Task.status,
        func.count(Task.id).label("count")
    ).where(task_user_cond).group_by(Task.recurrence_type, Task.status)
    
    status_results = (await db.execute(status_stmt)).all()

    # Map counts by (recurrence_type, status)
    counts_map: Dict[Tuple[str, str], int] = {}
    total = 0
    completed = 0
    in_progress = 0
    pending = 0
    overdue = 0

    for rec_type, st, cnt in status_results:
        counts_map[(rec_type, st)] = cnt
        total += cnt
        if st == "COMPLETED":
            completed += cnt
        elif st == "IN_PROGRESS":
            in_progress += cnt
        elif st == "PENDING":
            pending += cnt
        elif st == "OVERDUE":
            overdue += cnt

    completion_rate = round((completed / total * 100.0), 1) if total > 0 else 0.0

    # 2. Build Frequency Breakdowns from counts_map
    def build_frequency_stats(rec_types: List[str]) -> FrequencyBreakdown:
        sub_total = sum(counts_map.get((r, s), 0) for r in rec_types for s in ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELLED"])
        sub_comp = sum(counts_map.get((r, "COMPLETED"), 0) for r in rec_types)
        sub_over = sum(counts_map.get((r, "OVERDUE"), 0) for r in rec_types)
        sub_in_prog = sum(counts_map.get((r, "IN_PROGRESS"), 0) for r in rec_types)
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

    # 3. Category Breakdown Aggregation via SQL JOIN
    cat_stmt = select(
        Category.id,
        Category.name,
        Category.color,
        func.count(Task.id).label("total"),
        func.count(case((Task.status == "COMPLETED", 1))).label("completed")
    ).outerjoin(Task, and_(Task.category_id == Category.id, task_user_cond)).group_by(Category.id, Category.name, Category.color)

    cat_results = (await db.execute(cat_stmt)).all()
    cat_breakdowns: List[CategoryBreakdown] = [
        CategoryBreakdown(
            category_id=cid,
            category_name=cname,
            color=ccolor,
            total=ctotal,
            completed=ccomp
        )
        for cid, cname, ccolor, ctotal, ccomp in cat_results
    ]

    # 4. Memory-Efficient Streak Calculation (Last 90 days only)
    ninety_days_ago = date.today() - timedelta(days=90)
    
    diary_dates_stmt = select(distinct(DiaryEntry.entry_date)).where(
        and_(
            DiaryEntry.entry_date >= ninety_days_ago,
            diary_user_cond
        )
    )
    diary_dates = set((await db.execute(diary_dates_stmt)).scalars().all())

    task_dates_stmt = select(distinct(func.date(Task.completed_at))).where(
        and_(
            Task.completed_at.is_not(None),
            Task.completed_at >= datetime.now(timezone.utc) - timedelta(days=90),
            task_user_cond
        )
    )
    task_date_strs = (await db.execute(task_dates_stmt)).scalars().all()
    task_dates = set()
    for d in task_date_strs:
        if isinstance(d, str):
            try:
                task_dates.add(date.fromisoformat(d))
            except ValueError:
                pass
        elif isinstance(d, date):
            task_dates.add(d)

    active_dates = diary_dates.union(task_dates)

    streak_days = 0
    today = date.today()
    check_day = today

    if check_day in active_dates:
        streak_days += 1
        check_day -= timedelta(days=1)
    else:
        yesterday = today - timedelta(days=1)
        if yesterday in active_dates:
            check_day = yesterday
        else:
            check_day = None

    while check_day and check_day in active_dates:
        streak_days += 1
        check_day -= timedelta(days=1)

    # 5. Fast Diary Aggregation Metrics via SQL
    diary_stats_stmt = select(
        func.count(DiaryEntry.id),
        func.coalesce(func.avg(DiaryEntry.productivity_score), 0.0)
    ).where(diary_user_cond)
    diary_count, avg_productivity = (await db.execute(diary_stats_stmt)).one()

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
        total_diary_entries=diary_count or 0,
        average_productivity=round(float(avg_productivity or 0.0), 1)
    )
