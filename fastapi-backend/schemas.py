from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# USER SCHEMAS
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"

class UserLogin(BaseModel):
    username: str  # Can be email
    password: str

class UserBase(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    user: UserBase
    token: Optional[str] = None

# PROJECT SCHEMAS
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "active"

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: str
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True 