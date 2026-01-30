from sqlalchemy import Column, String, Text, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class Cliente(BaseModel):
    __tablename__ = "clientes"
    
    nome = Column(String(255), nullable=False)
    cpf = Column(String(14), nullable=True, unique=True, index=True)
    data_nascimento = Column(Date, nullable=True)
    empreendimento = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True, index=True)  # Tornado opcional
    telefone = Column(String(20), nullable=True)
    whatsapp = Column(String(20), nullable=True)
    origem_lead = Column(String(100), nullable=True)  # Tag do funil (ex: "Média", "Alta")
    observacoes = Column(Text, nullable=True)
    
    # Foreign Keys
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)  # Lead que originou este cliente
    
    # Relationships
    lead_origem = relationship("Lead", foreign_keys=[lead_id], uselist=False)
    propostas = relationship("Proposta", back_populates="cliente", cascade="all, delete-orphan")

