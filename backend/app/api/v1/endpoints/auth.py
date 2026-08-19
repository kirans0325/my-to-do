from typing import Optional, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

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

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
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
    total_tasks: int
    total_diary_entries: int
    created_at: Optional[str] = None

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterInput, db: AsyncSession = Depends(get_db)):
    """Register a new user account for a friend or family member."""
    # Check if username or email is already taken
    existing = await db.execute(
        select(User).where(or_(User.username == payload.username.strip(), User.email == payload.email.lower().strip()))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this username or email already exists.",
        )

    # First user or admin email automatically gets ADMIN role
    user_count_res = await db.execute(select(func.count(User.id)))
    user_count = user_count_res.scalar() or 0
    role = "ADMIN" if (user_count == 0 or payload.username.lower() == "admin") else "USER"

    new_user = User(
        username=payload.username.strip(),
        email=payload.email.lower().strip(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip() if payload.full_name else None,
        role=role,
        is_active=True,
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
            created_at=new_user.created_at.isoformat() if new_user.created_at else None,
        ),
    )

@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginInput, db: AsyncSession = Depends(get_db)):
    """Login with email or username and password."""
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

    token = create_access_token({"sub": str(user.id), "username": user.username, "role": user.role})

    return AuthResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
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
        created_at=current_user.created_at.isoformat() if current_user.created_at else None,
    )

@router.get("/users", response_model=List[FamilyUserSummary])
async def list_family_users(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint: List all registered family and friend accounts and their usage."""
    users_result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = users_result.scalars().all()

    summary_list = []
    for u in users:
        tasks_count = (await db.execute(select(func.count(Task.id)).where(Task.user_id == u.id))).scalar() or 0
        diary_count = (await db.execute(select(func.count(DiaryEntry.id)).where(DiaryEntry.user_id == u.id))).scalar() or 0

        summary_list.append(
            FamilyUserSummary(
                id=u.id,
                username=u.username,
                email=u.email,
                full_name=u.full_name,
                role=u.role,
                total_tasks=tasks_count,
                total_diary_entries=diary_count,
                created_at=u.created_at.isoformat() if u.created_at else None,
            )
        )

    return summary_list
