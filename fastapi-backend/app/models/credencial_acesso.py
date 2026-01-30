from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..core.database import Base
import uuid
from datetime import datetime


class CredencialAcesso(Base):
    __tablename__ = "credenciais_acesso"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    projeto_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    
    # Informações básicas
    nome_acesso = Column(String(200), nullable=False)  # Ex: "Gmail Marketing Principal"
    plataforma = Column(String(100), nullable=False)   # Ex: "Gmail", "ManycChat", "Facebook Ads"
    link_acesso = Column(Text, nullable=True)          # URL de login
    
    # Credenciais
    usuario = Column(String(200), nullable=True)       # Email/usuário
    senha = Column(Text, nullable=False)               # Senha (será criptografada)
    
    # Informações adicionais
    observacoes = Column(Text, nullable=True)          # Notas extras
    ativo = Column(Boolean, default=True)              # Se a credencial está ativa
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    projeto = relationship("Project", back_populates="credenciais_acesso")
    
    def __repr__(self):
        return f"<CredencialAcesso(id={self.id}, nome_acesso={self.nome_acesso}, plataforma={self.plataforma})>" 