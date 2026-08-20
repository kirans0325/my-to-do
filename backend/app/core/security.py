import os
import hashlib
import hmac
import base64
import json
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db

# Secret key for JWT signing (falls back to a default secret if not set in env)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "taskflow-super-secret-jwt-key-2026-secure-auth")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

http_bearer = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not plain_password:
        return False
    try:
        # 1. PBKDF2 format (pbkdf2:salt_hex:hash_hex)
        if hashed_password.startswith("pbkdf2:"):
            parts = hashed_password.split(":")
            if len(parts) == 3:
                salt = bytes.fromhex(parts[1])
                expected_hash = parts[2]
                computed = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000).hex()
                return hmac.compare_digest(computed, expected_hash)

        # 2. Standard bcrypt format ($2a$, $2b$, $2y$)
        if hashed_password.startswith(("$2a$", "$2b$", "$2y$")):
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

        # 3. Fallback passlib check
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = os.urandom(16)
    hash_hex = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000).hex()
    return f"pbkdf2:{salt.hex()}:{hash_hex}"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None

async def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: AsyncSession = Depends(get_db)
):
    """Returns the current User if valid Bearer token provided, otherwise None."""
    if not auth or not auth.credentials:
        return None
    
    payload = decode_access_token(auth.credentials)
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    from app.models.user import User
    try:
        user_id_int = int(user_id)
        result = await db.execute(select(User).where(User.id == user_id_int))
        return result.scalar_one_or_none()
    except Exception:
        return None

async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: AsyncSession = Depends(get_db)
):
    """Requires authentication. Raises 401 if token is missing or invalid."""
    user = await get_current_user_optional(auth, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in to access your personal workspace.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_current_admin(
    current_user = Depends(get_current_user)
):
    """Requires ADMIN role. Raises 403 if user is not admin."""
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )
    return current_user
