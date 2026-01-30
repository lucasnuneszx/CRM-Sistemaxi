from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
from ..models.notificacao import NotificationType, NotificationStatus


class NotificacaoBase(BaseModel):
    tipo: NotificationType
    titulo: str
    mensagem: str
    contexto_tipo: Optional[str] = None
    contexto_id: Optional[uuid.UUID] = None
    contexto_nome: Optional[str] = None
    action_url: Optional[str] = None


class NotificacaoCreate(NotificacaoBase):
    usuario_id: Optional[uuid.UUID] = None  # Para quem enviar (opcional quando usar /multiple)
    from_user_id: Optional[uuid.UUID] = None  # Quem está enviando (opcional, pode ser o usuário logado)


class NotificacaoUpdate(BaseModel):
    status: Optional[NotificationStatus] = None


class NotificacaoResponse(NotificacaoBase):
    id: uuid.UUID
    usuario_id: uuid.UUID
    from_user_id: Optional[uuid.UUID] = None
    status: NotificationStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    read_at: Optional[str] = None
    
    # Dados do usuário que enviou (opcional)
    from_user_name: Optional[str] = None
    from_user_avatar: Optional[str] = None
    
    class Config:
        from_attributes = True


class NotificacaoCountResponse(BaseModel):
    total: int
    unread: int
    urgent: int

