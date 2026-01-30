from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from ..core.database import get_db
from ..core.security import verify_token
from ..services.user_service import UserService
from ..models.user import User

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        user_id = verify_token(credentials.credentials)
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    user = UserService.get_user(db, user_id=user_id)
    if user is None:
        raise credentials_exception
    
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current admin user"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user 