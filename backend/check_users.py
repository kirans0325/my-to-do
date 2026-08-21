import asyncio
from app.core.database import AsyncSessionLocal, init_db
from app.models.user import User
from app.core.security import verify_password
from sqlalchemy import select

async def check_users():
    await init_db()
    async with AsyncSessionLocal() as s:
        res = await s.execute(select(User))
        users = res.scalars().all()
        print(f"Total users in DB: {len(users)}")
        for u in users:
            is_valid = verify_password("Admin@123456", u.hashed_password)
            print(f"ID: {u.id} | User: '{u.username}' | Email: '{u.email}' | Role: {u.role} | HashPrefix: {u.hashed_password[:20]} | Admin@123456 Match: {is_valid}")

if __name__ == "__main__":
    asyncio.run(check_users())
