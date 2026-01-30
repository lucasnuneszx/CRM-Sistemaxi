from sqlalchemy import Column, String, Integer, Date, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from ..core.database import Base


class MetricasRedesSociais(Base):
    __tablename__ = "metricas_redes_sociais"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    projeto_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    data_referente = Column(Date, nullable=False, index=True)
    
    # Métricas das redes sociais (apenas quantidades)
    seguidores_instagram = Column(Integer, nullable=True)
    inscritos_telegram = Column(Integer, nullable=True)
    leads_whatsapp = Column(Integer, nullable=True)
    seguidores_facebook = Column(Integer, nullable=True)
    inscritos_youtube = Column(Integer, nullable=True)
    seguidores_tiktok = Column(Integer, nullable=True)
    
    # Campos gerais
    observacoes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relacionamentos
    projeto = relationship("Project", back_populates="metricas_redes_sociais")
    
    def __repr__(self):
        return f"<MetricasRedesSociais(id={self.id}, projeto_id={self.projeto_id}, data={self.data_referente})>" 