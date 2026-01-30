from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class CredencialAcessoBase(BaseModel):
    nome_acesso: str = Field(..., min_length=1, max_length=200, description="Nome identificador do acesso")
    plataforma: str = Field(..., min_length=1, max_length=100, description="Plataforma ou serviço")
    link_acesso: Optional[str] = Field(None, description="URL de acesso/login")
    usuario: Optional[str] = Field(None, max_length=200, description="Email ou usuário")
    senha: str = Field(..., min_length=1, description="Senha de acesso")
    observacoes: Optional[str] = Field(None, description="Observações adicionais")
    ativo: bool = Field(True, description="Se a credencial está ativa")


class CredencialAcessoCreate(CredencialAcessoBase):
    projeto_id: uuid.UUID = Field(..., description="ID do projeto")


class CredencialAcessoUpdate(BaseModel):
    nome_acesso: Optional[str] = Field(None, min_length=1, max_length=200)
    plataforma: Optional[str] = Field(None, min_length=1, max_length=100)
    link_acesso: Optional[str] = None
    usuario: Optional[str] = Field(None, max_length=200)
    senha: Optional[str] = Field(None, min_length=1)
    observacoes: Optional[str] = None
    ativo: Optional[bool] = None


class CredencialAcessoResponse(CredencialAcessoBase):
    id: uuid.UUID
    projeto_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CredencialAcessoListResponse(BaseModel):
    id: uuid.UUID
    nome_acesso: str
    plataforma: str
    link_acesso: Optional[str] = None
    usuario: Optional[str] = None
    senha: str  # Senha visível na listagem
    ativo: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Schema para plataformas disponíveis (pode ser expandido)
class PlataformaOption(BaseModel):
    value: str
    label: str
    icon: Optional[str] = None


# Lista de plataformas pré-definidas
PLATAFORMAS_DISPONIVEIS = [
    PlataformaOption(value="gmail", label="Gmail", icon="mail"),
    PlataformaOption(value="manychat", label="ManyChat", icon="message-circle"),
    PlataformaOption(value="facebook_ads", label="Facebook Ads", icon="facebook"),
    PlataformaOption(value="google_ads", label="Google Ads", icon="search"),
    PlataformaOption(value="instagram", label="Instagram", icon="instagram"),
    PlataformaOption(value="whatsapp_business", label="WhatsApp Business", icon="message-square"),
    PlataformaOption(value="telegram", label="Telegram", icon="send"),
    PlataformaOption(value="youtube", label="YouTube", icon="youtube"),
    PlataformaOption(value="tiktok", label="TikTok", icon="music"),
    PlataformaOption(value="linkedin", label="LinkedIn", icon="linkedin"),
    PlataformaOption(value="twitter", label="Twitter/X", icon="twitter"),
    PlataformaOption(value="canva", label="Canva", icon="palette"),
    PlataformaOption(value="figma", label="Figma", icon="figma"),
    PlataformaOption(value="notion", label="Notion", icon="notebook"),
    PlataformaOption(value="trello", label="Trello", icon="trello"),
    PlataformaOption(value="slack", label="Slack", icon="slack"),
    PlataformaOption(value="discord", label="Discord", icon="gamepad-2"),
    PlataformaOption(value="zoom", label="Zoom", icon="video"),
    PlataformaOption(value="teams", label="Microsoft Teams", icon="users"),
    PlataformaOption(value="dropbox", label="Dropbox", icon="cloud"),
    PlataformaOption(value="google_drive", label="Google Drive", icon="hard-drive"),
    PlataformaOption(value="outro", label="Outro", icon="more-horizontal")
] 