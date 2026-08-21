from typing import List, Dict, Tuple, Optional
from datetime import datetime, timezone, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case, distinct
from sqlalchemy.orm import selectinload
from app.models.task import Task
from app.models.category import Category
from app.models.diary import DiaryEntry
from app.models.user import User
from app.schemas.stats_schema import (
    OverviewStatsResponse,
    FrequencyBreakdown,
    CategoryBreakdown,
    TimeAllocationItem,
    GrowingHabitItem,
    MoodDistributionItem
)

async def calculate_overview_stats(db: AsyncSession, current_user: Optional[User] = None) -> OverviewStatsResponse:
    """
    Highly optimized SQL-level statistical aggregation with minimal Python memory footprint.
    Performs grouping and count aggregations directly in the database engine with per-user filtering.
    """
    if not current_user:
        empty_freq = FrequencyBreakdown(total=0, completed=0, overdue=0, in_progress=0, completion_rate=0.0)
        return OverviewStatsResponse(
            total_tasks=0,
            completed_tasks=0,
            in_progress_tasks=0,
            pending_tasks=0,
            overdue_tasks=0,
            overall_completion_rate=0.0,
            current_streak_days=0,
            daily_stats=empty_freq,
            monthly_stats=empty_freq,
            yearly_stats=empty_freq,
            one_time_stats=empty_freq,
            categories=[],
            total_diary_entries=0,
            average_productivity=0.0
        )

    task_user_cond = (Task.user_id == current_user.id)
    diary_user_cond = (DiaryEntry.user_id == current_user.id)

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

    # 6. Analyze Time Allocation from Daily Notes & Tasks (Where time is being spent)
    diary_entries_stmt = select(DiaryEntry).where(diary_user_cond)
    user_diaries = (await db.execute(diary_entries_stmt)).scalars().all()

    category_time_map: Dict[str, int] = {}
    total_time_units = 0

    for diary in user_diaries:
        activities = diary.activities or []
        for act in activities:
            if isinstance(act, dict):
                cat = act.get("category") or act.get("activity") or "General"
            else:
                cat = "General"
            category_time_map[cat] = category_time_map.get(cat, 0) + 1
            total_time_units += 1

        if diary.tags:
            tag_list = [t.strip().capitalize() for t in diary.tags.split(",") if t.strip()]
            for tag in tag_list:
                category_time_map[tag] = category_time_map.get(tag, 0) + 1
                total_time_units += 1

    # Also include completed tasks per category in time allocation
    for cid, cname, ccolor, ctotal, ccomp in cat_results:
        if ccomp > 0:
            category_time_map[cname] = category_time_map.get(cname, 0) + ccomp
            total_time_units += ccomp

    # Colors for dynamic category tags
    palette = ["#6366F1", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#3B82F6", "#14B8A6"]
    time_allocation: List[TimeAllocationItem] = []
    
    if total_time_units > 0:
        idx = 0
        for cat_name, count in sorted(category_time_map.items(), key=lambda x: x[1], reverse=True)[:6]:
            color = next((c.color for cid, cname, ccolor, ctotal, ccomp in cat_results if cname == cat_name), palette[idx % len(palette)])
            pct = round((count / total_time_units) * 100.0, 1)
            time_allocation.append(TimeAllocationItem(
                category_name=cat_name,
                color=color,
                count=count,
                percentage=pct
            ))
            idx += 1

    # 7. Analyze Growing Habits (What habits are growing)
    daily_tasks_stmt = select(Task).options(
        selectinload(Task.category)
    ).where(and_(Task.recurrence_type == "DAILY", task_user_cond))
    user_daily_tasks = (await db.execute(daily_tasks_stmt)).scalars().all()

    growing_habits: List[GrowingHabitItem] = []
    for dt in user_daily_tasks:
        completed_cnt = 1 if dt.status == "COMPLETED" else (dt.progress_percentage // 25)
        rate = float(dt.progress_percentage) if dt.progress_percentage > 0 else (100.0 if dt.status == "COMPLETED" else 50.0)
        growing_habits.append(GrowingHabitItem(
            id=dt.id,
            name=dt.title,
            category_name=dt.category.name if dt.category else "Daily Habit",
            color=dt.category.color if dt.category else "#10B981",
            completed_count=completed_cnt,
            streak_days=streak_days if dt.status == "COMPLETED" else max(1, streak_days),
            consistency_rate=rate
        ))

    # 8. Mood & Energy Distribution from Daily Notes
    mood_counts_stmt = select(
        DiaryEntry.mood,
        func.count(DiaryEntry.id)
    ).where(diary_user_cond).group_by(DiaryEntry.mood)
    mood_results = (await db.execute(mood_counts_stmt)).all()

    total_mood_logs = sum(cnt for m, cnt in mood_results)
    mood_distribution: List[MoodDistributionItem] = []
    if total_mood_logs > 0:
        for mood_val, cnt in mood_results:
            if mood_val:
                mood_distribution.append(MoodDistributionItem(
                    mood=mood_val,
                    count=cnt,
                    percentage=round((cnt / total_mood_logs) * 100.0, 1)
                ))

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
        average_productivity=round(float(avg_productivity or 0.0), 1),
        time_allocation=time_allocation,
        growing_habits=growing_habits,
        mood_distribution=mood_distribution
    )
