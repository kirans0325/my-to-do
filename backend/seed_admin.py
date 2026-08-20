import asyncio
from app.core.database import AsyncSessionLocal, init_db
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy import select, or_

async def seed_admin():
    await init_db()
    async with AsyncSessionLocal() as session:
        res = await session.execute(
            select(User).where(or_(User.username == 'admin', User.email == 'admin@taskflow.app'))
        )
        user = res.scalar_one_or_none()
        if user:
            user.hashed_password = get_password_hash('Admin@123456')
            user.role = 'ADMIN'
            user.is_active = True
            print("[OK] Updated existing admin user password to Admin@123456")
        else:
            user = User(
                username='admin',
                email='admin@taskflow.app',
                hashed_password=get_password_hash('Admin@123456'),
                full_name='System Admin',
                role='ADMIN',
                is_active=True
            )
            session.add(user)
            print("[OK] Created new admin user admin@taskflow.app with password Admin@123456")
        await session.commit()

if __name__ == "__main__":
    asyncio.run(seed_admin())
