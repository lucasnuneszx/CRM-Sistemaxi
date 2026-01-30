from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class Atividade(BaseModel):
    __tablename__ = "atividades"

    nome = Column(String(255), nullable=False)
    descricao = Column(Text, nullable=True)
    status = Column(String(50), default="Não iniciada")  # Não iniciada, Em andamento, Concluída, Atrasada
    prazo = Column(DateTime, nullable=True)
    data_inicio = Column(DateTime, nullable=True)
    data_fim = Column(DateTime, nullable=True)
    prioridade = Column(String(20), default="Média")  # Baixa, Média, Alta, Urgente
    
    # Foreign Keys - Agora UUID
    projeto_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    responsavel_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    setor_id = Column(UUID(as_uuid=True), ForeignKey("setores.id"), nullable=True)
    
    # Relationships
    projeto = relationship("Project", back_populates="atividades")
    responsavel = relationship("User", back_populates="atividades")
    setor = relationship("Setor", back_populates="atividades")
    relatorios = relationship(
        "RelatorioDiario",
        secondary="relatorio_atividade_association",
        back_populates="atividades_realizadas"
    ) 