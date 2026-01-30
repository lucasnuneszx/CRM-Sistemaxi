from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
import uuid


class ResponsavelNested(BaseModel):
    id: uuid.UUID
    name: str
    
    class Config:
        from_attributes = True


class ClienteNested(BaseModel):
    id: uuid.UUID
    nome: str
    
    class Config:
        from_attributes = True


class PropostaBase(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    status: str = "em_aberto"  # em_aberto, pausado, cancelado, fechado, ganho
    progresso: int = 0  # 0-100
    valor: Decimal = 0
    observacoes: Optional[str] = None
    prioridade: Optional[int] = 0
    ordem: Optional[int] = 0
    data_criacao: datetime
    cliente_id: Optional[uuid.UUID] = None
    responsavel_id: Optional[uuid.UUID] = None


class PropostaCreate(PropostaBase):
    pass


class PropostaUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    status: Optional[str] = None
    progresso: Optional[int] = None
    valor: Optional[Decimal] = None
    observacoes: Optional[str] = None
    prioridade: Optional[int] = None
    ordem: Optional[int] = None
    cliente_id: Optional[uuid.UUID] = None
    responsavel_id: Optional[uuid.UUID] = None


class PropostaResponse(PropostaBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    responsavel: Optional[ResponsavelNested] = None
    cliente: Optional[ClienteNested] = None

    class Config:
        from_attributes = True


