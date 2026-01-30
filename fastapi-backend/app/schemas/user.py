from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
import uuid

if TYPE_CHECKING:
    from ..models.user import User


class SetorInfo(BaseModel):
    """Setor info for user response"""
    id: uuid.UUID
    nome: str


class UserBase(BaseModel):
    name: str  # Nome completo
    username: str  # Login/username
    email: EmailStr
    is_active: bool = True
    is_admin: bool = False
    setor_id: Optional[uuid.UUID] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    setor_id: Optional[uuid.UUID] = None
    foto_perfil: Optional[str] = None
    telefone: Optional[str] = None
    bio: Optional[str] = None


class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserResponseFrontend(BaseModel):
    """User response compatible with frontend format"""
    id: uuid.UUID
    name: str  # Nome completo
    email: EmailStr
    role: str
    createdAt: datetime = Field(alias="created_at")
    is_active: bool = True
    setorId: Optional[uuid.UUID] = Field(None, alias="setor_id")
    setor: Optional[SetorInfo] = None
    foto_perfil: Optional[str] = None
    telefone: Optional[str] = None
    bio: Optional[str] = None
    
    @classmethod
    def from_user(cls, user: 'User'):
        setor_info = None
        if user.setor:
            setor_info = SetorInfo(id=user.setor.id, nome=user.setor.nome)
        
        # Garantir que name nunca seja None
        user_name = user.name if user.name else user.username if user.username else "Usuário"
        
        return cls(
            id=user.id,
            name=user_name,  # Nome completo direto do campo name, com fallback
            email=user.email,
            role="admin" if user.is_admin else "user",
            createdAt=user.created_at,
            is_active=user.is_active,
            setorId=user.setor_id,
            setor=setor_info,
            foto_perfil=user.foto_perfil if hasattr(user, 'foto_perfil') else None,
            telefone=user.telefone if hasattr(user, 'telefone') else None,
            bio=user.bio if hasattr(user, 'bio') else None
        )
    
    class Config:
        from_attributes = True
        populate_by_name = True 