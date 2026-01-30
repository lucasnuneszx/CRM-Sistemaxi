from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
import uuid
# Import AtividadeResponse for type hinting, but use as string for forward reference
# from .atividade import AtividadeResponse 


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "active"
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    budget: Optional[Decimal] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    budget: Optional[Decimal] = None
    owner_id: Optional[uuid.UUID] = None


class ProjectResponse(ProjectBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    atividades: List['AtividadeResponse'] = [] # Used string literal for forward reference
    
    # Nested data
    owner: Optional[dict] = None  # Informações do usuário criador
    cliente: Optional[dict] = None  # Informações do cliente (se houver)
    
    class Config:
        from_attributes = True

# Forward references are generally resolved by Pydantic v2 automatically at runtime.
# If not, model_rebuild() would be needed after all models are defined.
# For example, in an __init__.py or after all imports.
# from .atividade import AtividadeResponse
# ProjectResponse.model_rebuild() 