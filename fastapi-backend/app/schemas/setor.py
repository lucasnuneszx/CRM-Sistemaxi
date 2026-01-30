from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class SetorBase(BaseModel):
    nome: str
    descricao: Optional[str] = None


class SetorCreate(SetorBase):
    pass


class SetorUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None


class SetorResponse(SetorBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 