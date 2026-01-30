from sqlalchemy import Column, String, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel
import uuid
import enum


class NotificationType(str, enum.Enum):
    NUDGE = "nudge"  # Cobrança de status
    INFO = "info"  # Informativo
    URGENT = "urgent"  # Urgente


class NotificationStatus(str, enum.Enum):
    UNREAD = "unread"  # Não lida
    READ = "read"  # Lida
    DISMISSED = "dismissed"  # Descartada


class Notificacao(BaseModel):
    __tablename__ = "notificacoes"
    
    # Dados básicos
    tipo = Column(SQLEnum(NotificationType), nullable=False, default=NotificationType.INFO)
    titulo = Column(String, nullable=False)
    mensagem = Column(Text, nullable=False)
    status = Column(SQLEnum(NotificationStatus), nullable=False, default=NotificationStatus.UNREAD)
    
    # Relacionamentos
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    from_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Quem enviou
    
    # Contexto (opcional - para vincular a projeto, atividade, etc)
    contexto_tipo = Column(String, nullable=True)  # 'project', 'activity', 'lead', 'proposal'
    contexto_id = Column(UUID(as_uuid=True), nullable=True)  # ID do contexto
    contexto_nome = Column(String, nullable=True)  # Nome do contexto (ex: nome do projeto)
    
    # URL de ação (opcional)
    action_url = Column(String, nullable=True)
    
    # Data de leitura
    read_at = Column(String, nullable=True)  # ISO string
    
    # Relationships
    usuario = relationship("User", foreign_keys=[usuario_id], backref="notificacoes_recebidas")
    from_user = relationship("User", foreign_keys=[from_user_id], backref="notificacoes_enviadas")

