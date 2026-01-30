from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from .base import Base


class StatusCriativo(enum.Enum):
    MATERIAL_CRU = "material_cru"
    EM_EDICAO = "em_edicao"
    AGUARDANDO_REVISAO = "aguardando_revisao"
    APROVADO = "aprovado"
    REJEITADO = "rejeitado"


class PrioridadeCriativo(enum.Enum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    URGENTE = "urgente"


class TipoArquivo(enum.Enum):
    IMAGEM = "IMAGEM"
    VIDEO = "VIDEO"
    AUDIO = "AUDIO"
    DOCUMENTO = "DOCUMENTO"


class Criativo(Base):
    __tablename__ = "criativos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(255), nullable=False)
    descricao = Column(Text)
    
    # Status do workflow
    status = Column(SQLEnum(StatusCriativo), nullable=False, default=StatusCriativo.MATERIAL_CRU)
    
    # Tipo de arquivo
    tipo = Column(SQLEnum(TipoArquivo), nullable=False)
    
    # URLs dos arquivos
    arquivo_cru_key = Column(String(500))
    arquivo_editado_key = Column(String(500))
    
    # Relacionamentos com usuários
    criado_por_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    editor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Relacionamento com projeto
    projeto_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    
    # Prioridade e prazo
    prioridade = Column(Integer, default=2)
    prazo = Column(DateTime)
    
    # Datas específicas
    data_inicio_edicao = Column(DateTime)
    data_finalizacao = Column(DateTime)
    
    # Observações e feedback
    observacoes = Column(Text)
    
    # Informações de contato do lead
    email = Column(String(255))
    telefone = Column(String(20))
    empresa = Column(String(255))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    criado_por = relationship("User", foreign_keys=[criado_por_id])
    editor = relationship("User", foreign_keys=[editor_id])
    projeto = relationship("Project")
    
    # Propriedades para compatibilidade com o frontend
    @property
    def titulo(self):
        return self.nome
    
    @property
    def tipo_arquivo(self):
        return self.tipo
        
    @property
    def arquivo_bruto_url(self):
        return self.arquivo_cru_key
        
    @property
    def arquivo_editado_url(self):
        return self.arquivo_editado_key
        
    @property
    def editado_por_id(self):
        return self.editor_id 