from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date
import uuid


class ClienteBase(BaseModel):
    nome: str
    cpf: Optional[str] = None
    data_nascimento: Optional[date] = None
    empreendimento: Optional[str] = None
    email: Optional[str] = None  # Tornado opcional (string simples para permitir None)
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None
    origem_lead: Optional[str] = None
    observacoes: Optional[str] = None
    lead_id: Optional[uuid.UUID] = None


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    cpf: Optional[str] = None
    data_nascimento: Optional[date] = None
    empreendimento: Optional[str] = None
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None
    origem_lead: Optional[str] = None
    observacoes: Optional[str] = None
    lead_id: Optional[uuid.UUID] = None


class ClienteResponse(ClienteBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

