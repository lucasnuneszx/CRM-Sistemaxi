from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


# Schemas para configuração de canais
class CanalConfig(BaseModel):
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    utm_medium: Optional[str] = None  # Override do medium base se necessário


class SubcanalConfig(BaseModel):
    close_friends: Optional[CanalConfig] = None
    normal: Optional[CanalConfig] = None
    free: Optional[CanalConfig] = None
    vip: Optional[CanalConfig] = None


class CanaisConfigComplete(BaseModel):
    geral: Optional[CanalConfig] = None
    instagram: Optional[SubcanalConfig] = None
    telegram: Optional[SubcanalConfig] = None


class CasaParceiraBase(BaseModel):
    nome: str
    slug: str
    logo_url: Optional[str] = None
    link_base: str
    codigo_afiliado: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    canais_config: Optional[CanaisConfigComplete] = None
    ativo: bool = True


class CasaParceiraCreate(CasaParceiraBase):
    projeto_id: uuid.UUID


class CasaParceiraUpdate(BaseModel):
    nome: Optional[str] = None
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    link_base: Optional[str] = None
    codigo_afiliado: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    canais_config: Optional[CanaisConfigComplete] = None
    ativo: Optional[bool] = None


class CasaParceiraResponse(CasaParceiraBase):
    id: uuid.UUID
    projeto_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Schema para geração de link
class LinkRequest(BaseModel):
    canal: str  # geral, instagram, telegram
    subcanal: Optional[str] = None  # close_friends, normal, free, vip
    # Campos opcionais para override pontual (raramente usados)
    override_utm_content: Optional[str] = None
    override_utm_term: Optional[str] = None


class LinkResponse(BaseModel):
    link_final: str
    utm_params: Dict[str, str] 