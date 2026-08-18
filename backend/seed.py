import asyncio
from datetime import datetime, date, timezone, timedelta
from app.core.database import AsyncSessionLocal, init_db
from app.models.category import Category
from app.models.task import Task
from app.models.diary import DiaryEntry
from app.models.progress import ProgressEntry
from app.models.reminder import ReminderLog

async def seed_data():
    print("[*] Initializing DB and seeding initial data...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # 1. Seed Categories
        work_cat = Category(name="Work & Coding", color="#3B82F6", icon="briefcase")
        fitness_cat = Category(name="Health & Fitness", color="#10B981", icon="heart")
        finance_cat = Category(name="Finance & Bills", color="#F59E0B", icon="dollar-sign")
        personal_cat = Category(name="Personal & Growth", color="#8B5CF6", icon="user")

        session.add_all([work_cat, fitness_cat, finance_cat, personal_cat])
        await session.commit()
        await session.refresh(work_cat)
        await session.refresh(fitness_cat)
        await session.refresh(finance_cat)
        await session.refresh(personal_cat)

        now_utc = datetime.now(timezone.utc)
        today_date = date.today()

        # 2. Seed Tasks (Daily, Monthly, Yearly, Overdue, and One-Time)
        tasks = [
            # Daily Task
            Task(
                title="Morning Workout & 15min Stretch",
                description="Daily morning physical exercise routine and hydration check.",
                recurrence_type="DAILY",
                recurrence_interval=1,
                due_date=now_utc.replace(hour=8, minute=30, second=0),
                priority="HIGH",
                status="COMPLETED",
                progress_percentage=100,
                category_id=fitness_cat.id,
                subtasks=[
                    {"id": 1, "title": "20 pushups and 30 squats", "completed": True},
                    {"id": 2, "title": "15 min full body stretch", "completed": True},
                    {"id": 3, "title": "Drink 500ml water", "completed": True}
                ],
                completed_at=now_utc - timedelta(hours=3)
            ),
            # Daily Task In Progress
            Task(
                title="Review Pull Requests & Team Standup",
                description="Check GitHub repository pull requests and write daily standup update.",
                recurrence_type="DAILY",
                recurrence_interval=1,
                due_date=now_utc.replace(hour=11, minute=0, second=0),
                priority="MEDIUM",
                status="IN_PROGRESS",
                progress_percentage=60,
                category_id=work_cat.id,
                subtasks=[
                    {"id": 1, "title": "Review PR #142", "completed": True},
                    {"id": 2, "title": "Post standup in Slack", "completed": True},
                    {"id": 3, "title": "Merge release branch", "completed": False}
                ]
            ),
            # Monthly Reminder
            Task(
                title="Monthly Cloud & Infrastructure Cost Review",
                description="Audit Neon PostgreSQL, AWS, and server resource utilization and monthly budget.",
                recurrence_type="MONTHLY",
                recurrence_interval=1,
                recurrence_day_of_month=28,
                due_date=now_utc + timedelta(days=10),
                priority="HIGH",
                status="PENDING",
                progress_percentage=25,
                category_id=finance_cat.id,
                subtasks=[
                    {"id": 1, "title": "Export billing breakdown", "completed": True},
                    {"id": 2, "title": "Check database connection pool spikes", "completed": False},
                    {"id": 3, "title": "Optimize underutilized instances", "completed": False}
                ]
            ),
            # Yearly Reminder
            Task(
                title="Yearly Vehicle Insurance & Tax Renewal",
                description="Review policy coverage, compare top 3 insurance provider quotes, and renew.",
                recurrence_type="YEARLY",
                recurrence_interval=1,
                recurrence_month_of_year=9,
                recurrence_day_of_month=15,
                due_date=now_utc + timedelta(days=28),
                priority="URGENT",
                status="PENDING",
                progress_percentage=33,
                category_id=finance_cat.id,
                subtasks=[
                    {"id": 1, "title": "Collect renewal document from insurer", "completed": True},
                    {"id": 2, "title": "Verify zero-depreciation add-on", "completed": False},
                    {"id": 3, "title": "Complete online payment & download certificate", "completed": False}
                ]
            ),
            # Overdue Task (to demonstrate Overdue Alert banner)
            Task(
                title="Submit Monthly Expense Receipts",
                description="Upload receipts for client travel and software subscription reimbursements.",
                recurrence_type="MONTHLY",
                recurrence_interval=1,
                due_date=now_utc - timedelta(days=2),
                priority="HIGH",
                status="OVERDUE",
                progress_percentage=30,
                category_id=finance_cat.id,
                subtasks=[
                    {"id": 1, "title": "Scan paper receipts", "completed": True},
                    {"id": 2, "title": "Fill expense claim sheet", "completed": False}
                ]
            ),
            # Personal Goal Task
            Task(
                title="Read 20 Pages of System Design Book",
                description="Chapter 4: Distributed Database Replication and Consistency models.",
                recurrence_type="DAILY",
                recurrence_interval=1,
                due_date=now_utc + timedelta(hours=4),
                priority="LOW",
                status="PENDING",
                progress_percentage=0,
                category_id=personal_cat.id
            )
        ]

        session.add_all(tasks)
        await session.commit()

        # Seed Overdue Reminder Log for the overdue task
        overdue_task = next(t for t in tasks if t.status == "OVERDUE")
        reminder = ReminderLog(
            task_id=overdue_task.id,
            triggered_at=now_utc - timedelta(days=2),
            alert_type="OVERDUE",
            message=f"Task '{overdue_task.title}' is overdue by 2 days!",
            is_acknowledged=False
        )
        session.add(reminder)

        # 3. Seed Daily Diary & Activity Journal Entries
        diary_entries = [
            DiaryEntry(
                entry_date=today_date,
                title="Built TaskFlow Pro Full-Stack System",
                content="Set up FastAPI async backend architecture with SQLite + Neon PostgreSQL support. Created responsive React Native Expo frontend for Web and Android with daily diary tracking!",
                mood="GREAT",
                productivity_score=9,
                tags="coding,fullstack,reactnative,fastapi",
                activities=[
                    {"time": "08:30 AM", "activity": "Morning run & stretching", "category": "Health", "done": True},
                    {"time": "10:00 AM", "activity": "FastAPI database architecture and models", "category": "Work", "done": True},
                    {"time": "02:30 PM", "activity": "React Native UI layout & components", "category": "Work", "done": True},
                    {"time": "06:00 PM", "activity": "Progress monitoring and alert worker testing", "category": "Work", "done": True}
                ]
            ),
            DiaryEntry(
                entry_date=today_date - timedelta(days=1),
                title="Architecture & Requirements Planning",
                content="Outlined the requirement for daily, monthly, and yearly recurring tasks, overdue notifications, and daily diary logging.",
                mood="GOOD",
                productivity_score=8,
                tags="planning,architecture",
                activities=[
                    {"time": "09:00 AM", "activity": "Drafted ERD and data flow models", "category": "Work", "done": True},
                    {"time": "03:00 PM", "activity": "Reviewed SQLite vs Neon PostgreSQL sync strategy", "category": "Work", "done": True}
                ]
            ),
            DiaryEntry(
                entry_date=today_date - timedelta(days=2),
                title="Weekend Reading & Rest",
                content="Spent time reading distributed systems and planned weekly milestones.",
                mood="GOOD",
                productivity_score=7,
                tags="reading,rest",
                activities=[
                    {"time": "10:00 AM", "activity": "Read 30 pages of System Design", "category": "Personal", "done": True}
                ]
            )
        ]

        session.add_all(diary_entries)
        await session.commit()
        print("[+] Database successfully seeded with categories, tasks, alerts, and diary logs!")

if __name__ == "__main__":
    asyncio.run(seed_data())
