from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class LeadStage(str, Enum):
    """Estágios do funil de vendas"""
    LEAD = "lead"
    CONTATO_INICIAL = "contato_inicial"
    PROPOSTA = "proposta"
    NEGOCIACAO = "negociacao"


class LeadBase(BaseModel):
    nome: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    empresa: Optional[str] = None
    observacoes: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[list] = None
    column_id: Optional[UUID] = None
    stage: LeadStage = LeadStage.LEAD
    projeto_id: Optional[UUID] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    empresa: Optional[str] = None
    observacoes: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[list] = None
    column_id: Optional[UUID] = None
    stage: Optional[LeadStage] = None


class LeadResponse(LeadBase):
    id: UUID
    criado_por_id: UUID
    data_cadastro: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
