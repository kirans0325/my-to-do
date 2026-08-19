import asyncio
from datetime import datetime, date, timezone, timedelta
from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal, init_db
from app.models.user import User
from app.models.category import Category
from app.models.task import Task
from app.models.diary import DiaryEntry
from app.models.progress import ProgressEntry
from app.models.reminder import ReminderLog
from app.core.security import get_password_hash

async def seed_data():
    print("[*] Initializing DB schema and seeding Admin user...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # 0. Seed Default Admin User
        admin_stmt = select(User).where(User.username == "admin")
        admin_user = (await session.execute(admin_stmt)).scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@taskflow.app",
                hashed_password=get_password_hash("Admin@123456"),
                full_name="Administrator",
                role="ADMIN",
                is_active=True
            )
            session.add(admin_user)
            await session.commit()
            await session.refresh(admin_user)
            print("[+] Seeded Default Admin User: admin (Password: Admin@123456)")
        else:
            print("[*] Admin user already exists.")

        # 1. Seed Categories if empty
        cat_count = (await session.execute(select(func.count(Category.id)))).scalar() or 0
        if cat_count == 0:
            work_cat = Category(name="Work & Coding", color="#3B82F6", icon="briefcase")
            fitness_cat = Category(name="Health & Fitness", color="#10B981", icon="heart")
            finance_cat = Category(name="Finance & Bills", color="#F59E0B", icon="dollar-sign")
            personal_cat = Category(name="Personal & Growth", color="#8B5CF6", icon="user")
            session.add_all([work_cat, fitness_cat, finance_cat, personal_cat])
            await session.commit()
            print("[+] Seeded initial categories.")
        else:
            print(f"[*] Categories already present ({cat_count} categories).")

    print("[+] Database seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_data())
