from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4
from enum import Enum
from sqlalchemy.dialects.postgresql import UUID

from ..core.database import Base


class LeadStage(str, Enum):
    """Estágios do funil de vendas"""
    LEAD = "lead"
    CONTATO_INICIAL = "contato_inicial"
    PROPOSTA = "proposta"
    NEGOCIACAO = "negociacao"


class Lead(Base):
    """Modelo de Lead - Funil de Vendas (independente de Criativos)"""
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    # Informações do lead
    nome = Column(String(255), nullable=False)
    email = Column(String(255))
    telefone = Column(String(20))
    empresa = Column(String(255))
    
    # Estágio no funil
    stage = Column(SQLEnum(LeadStage), nullable=False, default=LeadStage.LEAD)
    
    # Relacionamentos
    criado_por_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    projeto_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    column_id = Column(UUID(as_uuid=True), ForeignKey("kanban_columns.id", ondelete="SET NULL"), nullable=True)
    
    # Campos adicionais para compatibilidade
    status = Column(String(20), default="FREE", nullable=True)  # FREE, OCCUPIED, CLOSED
    tags = Column(Text, nullable=True)  # Array de tags (armazenado como JSON string)
    observacoes = Column(Text, nullable=True)
    data_cadastro = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    criado_por = relationship("User", foreign_keys=[criado_por_id])
    projeto = relationship("Project")
    column = relationship("KanbanColumn", back_populates="leads", foreign_keys=[column_id])
