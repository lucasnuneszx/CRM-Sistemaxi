from sqlalchemy import Column, String, Text, Boolean, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class CasaParceira(BaseModel):
    __tablename__ = "casas_parceiras"

    nome = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True)  # Para URL amigável
    logo_url = Column(String(500), nullable=True)  # URL da logo
    link_base = Column(String(1000), nullable=False)  # Link base de afiliado
    codigo_afiliado = Column(String(255), nullable=True)  # Código específico
    
    # Configurações UTM base
    utm_source = Column(String(255), nullable=True)
    utm_medium = Column(String(255), nullable=True)
    utm_campaign = Column(String(255), nullable=True)
    
    # Configurações específicas por canal (JSON)
    # Estrutura: {"geral": {"utm_content": "geral"}, "instagram": {"close_friends": {"utm_content": "ig_cf", "utm_term": "vip"}, "normal": {...}}}
    canais_config = Column(JSON, nullable=True)
    
    # Status
    ativo = Column(Boolean, default=True)
    
    # Relacionamento com projeto
    projeto_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    projeto = relationship("Project", back_populates="casas_parceiras") 