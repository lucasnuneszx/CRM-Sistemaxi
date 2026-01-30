from sqlalchemy import Column, String, Text, Integer, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import BaseModel
import enum


class PropostaStatus(enum.Enum):
    EM_ABERTO = "em_aberto"
    PAUSADO = "pausado"
    CANCELADO = "cancelado"
    FECHADO = "fechado"
    GANHO = "ganho"


class Proposta(BaseModel):
    __tablename__ = "propostas"
    
    titulo = Column(String(255), nullable=False)
    descricao = Column(Text, nullable=True)
    status = Column(String(20), default="em_aberto", nullable=False)  # em_aberto, pausado, cancelado, fechado, ganho
    progresso = Column(Integer, default=0, nullable=False)  # 0-100
    valor = Column(Numeric(10, 2), nullable=False, default=0)
    observacoes = Column(Text, nullable=True)
    prioridade = Column(Integer, nullable=True, default=0)  # Ordem de prioridade
    ordem = Column(Integer, nullable=True, default=0)  # Ordem de exibição
    data_criacao = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Foreign Keys
    cliente_id = Column(UUID(as_uuid=True), ForeignKey("clientes.id", ondelete="CASCADE"), nullable=True)
    responsavel_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    cliente = relationship("Cliente", back_populates="propostas")
    responsavel = relationship("User", foreign_keys=[responsavel_id])

