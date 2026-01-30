from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


# Nested schemas for relationships
class ProjetoNested(BaseModel):
    id: uuid.UUID
    name: str
    
    class Config:
        from_attributes = True


class UserNested(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    
    class Config:
        from_attributes = True


class SetorNested(BaseModel):
    id: uuid.UUID
    nome: str
    
    class Config:
        from_attributes = True


class AtividadeBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    status: str = "Não iniciada"
    prazo: Optional[datetime] = None
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    prioridade: str = "Média"
    projeto_id: Optional[uuid.UUID] = None
    responsavel_id: Optional[uuid.UUID] = None
    setor_id: Optional[uuid.UUID] = None


class AtividadeCreate(AtividadeBase):
    pass


class AtividadeUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    status: Optional[str] = None
    prazo: Optional[datetime] = None
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    prioridade: Optional[str] = None
    projeto_id: Optional[uuid.UUID] = None
    responsavel_id: Optional[uuid.UUID] = None
    setor_id: Optional[uuid.UUID] = None


class AtividadeResponse(AtividadeBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Nested objects with proper types
    projeto: Optional[ProjetoNested] = None
    responsavel: Optional[UserNested] = None
    setor: Optional[SetorNested] = None

    class Config:
        from_attributes = True 