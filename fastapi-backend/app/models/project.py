from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class Project(BaseModel):
    __tablename__ = "projects"
    
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="active")
    startDate = Column(DateTime)
    endDate = Column(DateTime)
    budget = Column(Numeric(10, 2))
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="projects")
    atividades = relationship("Atividade", back_populates="projeto", lazy="selectin", cascade="delete")
    casas_parceiras = relationship("CasaParceira", back_populates="projeto", lazy="selectin", cascade="delete")
    relatorios_diarios = relationship("RelatorioDiario", back_populates="projeto", lazy="selectin", cascade="delete")
    credenciais_acesso = relationship("CredencialAcesso", back_populates="projeto", lazy="selectin", cascade="delete")
    metricas_redes_sociais = relationship("MetricasRedesSociais", back_populates="projeto", lazy="selectin", cascade="delete")
    user_projects = relationship("UserProject", back_populates="project", cascade="all, delete-orphan")
    # funnel_stages = relationship("FunnelStage", back_populates="projeto", lazy="selectin", cascade="delete")  # TODO: Create FunnelStage model 