from sqlalchemy import Column, String, DateTime, Numeric, Integer, Boolean, Text, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..core.database import Base
import uuid
from datetime import datetime


# Tabela de associação para relacionamento many-to-many entre relatórios e atividades
relatorio_atividade_association = Table(
    'relatorio_atividade_association',
    Base.metadata,
    Column('relatorio_id', UUID(as_uuid=True), ForeignKey('relatorios_diarios.id'), primary_key=True),
    Column('atividade_id', UUID(as_uuid=True), ForeignKey('atividades.id'), primary_key=True)
)


class RelatorioDiario(Base):
    __tablename__ = "relatorios_diarios"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    projeto_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    
    # Data de referência do relatório
    data_referente = Column(DateTime, nullable=False)
    
    # Atividades realizadas (checkboxes)
    criacao_criativos = Column(Boolean, default=False)
    identidade_visual = Column(Boolean, default=False)
    outras_atividades = Column(Text, nullable=True)  # Campo livre para outras atividades
    
    # NOVO: Relacionamento com atividades do projeto
    atividades_realizadas = relationship(
        "Atividade",
        secondary=relatorio_atividade_association,
        back_populates="relatorios"
    )
    
    # Métricas de investimento
    valor_investido = Column(Numeric(10, 2), nullable=True)
    
    # Métricas de leads
    leads = Column(Integer, nullable=True)
    custo_por_lead = Column(Numeric(10, 2), nullable=True)
    
    # Métricas de registros
    registros = Column(Integer, nullable=True)
    custo_por_registro = Column(Numeric(10, 2), nullable=True)
    
    # Métricas de depósito
    deposito = Column(Numeric(12, 2), nullable=True)
    
    # Métricas de FTD (First Time Deposit)
    ftd = Column(Integer, nullable=True)
    custo_por_ftd = Column(Numeric(10, 2), nullable=True)
    valor_ftd = Column(Numeric(12, 2), nullable=True)
    
    # Métricas de CPA
    cpa = Column(Integer, nullable=True)
    comissao_cpa = Column(Numeric(10, 2), nullable=True)
    
    # Revshare
    revshare = Column(Numeric(10, 2), nullable=True)
    
    # Total de comissão do dia
    total_comissao_dia = Column(Numeric(10, 2), nullable=True)
    
    # Observações gerais
    observacoes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    projeto = relationship("Project", back_populates="relatorios_diarios")
    
    def __repr__(self):
        return f"<RelatorioDiario(id={self.id}, projeto_id={self.projeto_id}, data_referente={self.data_referente})>" 