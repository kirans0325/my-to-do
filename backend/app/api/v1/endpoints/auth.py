from typing import Optional, List
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc

from app.core.database import get_db
from app.models.user import User
from app.models.task import Task
from app.models.diary import DiaryEntry
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_admin,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RegisterInput(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6, max_length=100)
    full_name: Optional[str] = None

class LoginInput(BaseModel):
    login: str = Field(..., description="Email or Username")
    password: str = Field(..., min_length=1)

class ResetPasswordInput(BaseModel):
    new_password: str = Field(..., min_length=6, max_length=100)

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    login_count: int = 0
    last_login_at: Optional[str] = None
    created_at: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class FamilyUserSummary(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool = True
    login_count: int = 0
    last_login_at: Optional[str] = None
    total_tasks: int = 0
    completed_tasks: int = 0
    total_diary_entries: int = 0
    created_at: Optional[str] = None

class AdminAnalyticsSummary(BaseModel):
    total_users: int
    total_app_logins: int
    active_recently_count: int
    total_tasks_created: int
    total_tasks_completed: int
    total_diary_entries: int
    users: List[FamilyUserSummary]

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterInput, db: AsyncSession = Depends(get_db)):
    """Register a new user account for a friend or family member."""
    existing = await db.execute(
        select(User).where(or_(User.username == payload.username.strip(), User.email == payload.email.lower().strip()))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this username or email already exists.",
        )

    user_count_res = await db.execute(select(func.count(User.id)))
    user_count = user_count_res.scalar() or 0
    role = "ADMIN" if (user_count == 0 or payload.username.lower() == "admin") else "USER"
    now_utc = datetime.now(timezone.utc)

    new_user = User(
        username=payload.username.strip(),
        email=payload.email.lower().strip(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip() if payload.full_name else None,
        role=role,
        is_active=True,
        login_count=1,
        last_login_at=now_utc,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "username": new_user.username, "role": new_user.role})

    return AuthResponse(
        access_token=token,
        user=UserResponse(
            id=new_user.id,
            username=new_user.username,
            email=new_user.email,
            full_name=new_user.full_name,
            role=new_user.role,
            login_count=new_user.login_count,
            last_login_at=new_user.last_login_at.isoformat() if new_user.last_login_at else None,
            created_at=new_user.created_at.isoformat() if new_user.created_at else None,
        ),
    )

@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginInput, db: AsyncSession = Depends(get_db)):
    """Login with email or username and password, updating login frequency."""
    clean_login = payload.login.strip().lower()

    result = await db.execute(
        select(User).where(or_(func.lower(User.username) == clean_login, func.lower(User.email) == clean_login))
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact the administrator.",
        )

    # Track app logins and last activity timestamp
    user.login_count = (user.login_count or 0) + 1
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id), "username": user.username, "role": user.role})

    return AuthResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            login_count=user.login_count,
            last_login_at=user.last_login_at.isoformat() if user.last_login_at else None,
            created_at=user.created_at.isoformat() if user.created_at else None,
        ),
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get profile information for the authenticated user."""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        login_count=current_user.login_count or 0,
        last_login_at=current_user.last_login_at.isoformat() if current_user.last_login_at else None,
        created_at=current_user.created_at.isoformat() if current_user.created_at else None,
    )

@router.get("/users", response_model=List[FamilyUserSummary])
async def list_family_users(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint: List all registered accounts with login and activity statistics."""
    users_result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = users_result.scalars().all()

    summary_list = []
    for u in users:
        tasks_count = (await db.execute(select(func.count(Task.id)).where(Task.user_id == u.id))).scalar() or 0
        done_count = (await db.execute(select(func.count(Task.id)).where(Task.user_id == u.id, Task.status == "COMPLETED"))).scalar() or 0
        diary_count = (await db.execute(select(func.count(DiaryEntry.id)).where(DiaryEntry.user_id == u.id))).scalar() or 0

        summary_list.append(
            FamilyUserSummary(
                id=u.id,
                username=u.username,
                email=u.email,
                full_name=u.full_name,
                role=u.role,
                is_active=u.is_active,
                login_count=u.login_count or 0,
                last_login_at=u.last_login_at.isoformat() if u.last_login_at else None,
                total_tasks=tasks_count,
                completed_tasks=done_count,
                total_diary_entries=diary_count,
                created_at=u.created_at.isoformat() if u.created_at else None,
            )
        )

    return summary_list

@router.get("/admin-analytics", response_model=AdminAnalyticsSummary)
async def get_admin_analytics(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint: Get comprehensive platform logins trend and user analytics."""
    users_result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = users_result.scalars().all()

    now_utc = datetime.now(timezone.utc)
    recent_threshold = now_utc - timedelta(days=2)

    total_logins = sum(u.login_count or 0 for u in users)
    active_recently = sum(1 for u in users if u.last_login_at and u.last_login_at >= recent_threshold)

    total_tasks = (await db.execute(select(func.count(Task.id)))).scalar() or 0
    total_completed = (await db.execute(select(func.count(Task.id)).where(Task.status == "COMPLETED"))).scalar() or 0
    total_diary = (await db.execute(select(func.count(DiaryEntry.id)))).scalar() or 0

    user_summaries = []
    for u in users:
        tasks_count = (await db.execute(select(func.count(Task.id)).where(Task.user_id == u.id))).scalar() or 0
        done_count = (await db.execute(select(func.count(Task.id)).where(Task.user_id == u.id, Task.status == "COMPLETED"))).scalar() or 0
        diary_count = (await db.execute(select(func.count(DiaryEntry.id)).where(DiaryEntry.user_id == u.id))).scalar() or 0

        user_summaries.append(
            FamilyUserSummary(
                id=u.id,
                username=u.username,
                email=u.email,
                full_name=u.full_name,
                role=u.role,
                is_active=u.is_active,
                login_count=u.login_count or 0,
                last_login_at=u.last_login_at.isoformat() if u.last_login_at else None,
                total_tasks=tasks_count,
                completed_tasks=done_count,
                total_diary_entries=diary_count,
                created_at=u.created_at.isoformat() if u.created_at else None,
            )
        )

    return AdminAnalyticsSummary(
        total_users=len(users),
        total_app_logins=total_logins,
        active_recently_count=active_recently,
        total_tasks_created=total_tasks,
        total_tasks_completed=total_completed,
        total_diary_entries=total_diary,
        users=user_summaries,
    )

@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    payload: ResetPasswordInput,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint: Reset a user's password if they forgot it."""
    stmt = select(User).where(User.id == user_id)
    target_user = (await db.execute(stmt)).scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )

    target_user.hashed_password = get_password_hash(payload.new_password)
    target_user.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {
        "success": True,
        "message": f"Password for user '{target_user.username}' ({target_user.email}) has been reset successfully.",
    }

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint: Delete a user account."""
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot delete their own active account.",
        )

    stmt = select(User).where(User.id == user_id)
    target_user = (await db.execute(stmt)).scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    await db.delete(target_user)
    await db.commit()

    return {
        "success": True,
        "message": f"User '{target_user.username}' deleted successfully.",
    }
