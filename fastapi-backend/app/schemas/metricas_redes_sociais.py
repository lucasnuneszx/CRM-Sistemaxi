from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
import uuid


class MetricasRedesSociaisBase(BaseModel):
    data_referente: date
    
    # Métricas das redes sociais (apenas quantidades)
    seguidores_instagram: Optional[int] = Field(None, ge=0, description="Número de seguidores no Instagram")
    inscritos_telegram: Optional[int] = Field(None, ge=0, description="Número de inscritos no Telegram")
    leads_whatsapp: Optional[int] = Field(None, ge=0, description="Número de leads no WhatsApp")
    seguidores_facebook: Optional[int] = Field(None, ge=0, description="Número de seguidores no Facebook")
    inscritos_youtube: Optional[int] = Field(None, ge=0, description="Número de inscritos no YouTube")
    seguidores_tiktok: Optional[int] = Field(None, ge=0, description="Número de seguidores no TikTok")
    
    # Campos gerais
    observacoes: Optional[str] = None


class MetricasRedesSociaisCreate(MetricasRedesSociaisBase):
    projeto_id: uuid.UUID


class MetricasRedesSociaisUpdate(BaseModel):
    data_referente: Optional[date] = None
    seguidores_instagram: Optional[int] = Field(None, ge=0)
    inscritos_telegram: Optional[int] = Field(None, ge=0)
    leads_whatsapp: Optional[int] = Field(None, ge=0)
    seguidores_facebook: Optional[int] = Field(None, ge=0)
    inscritos_youtube: Optional[int] = Field(None, ge=0)
    seguidores_tiktok: Optional[int] = Field(None, ge=0)
    observacoes: Optional[str] = None


class MetricasRedesSociaisResponse(MetricasRedesSociaisBase):
    id: uuid.UUID
    projeto_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EstatisticasRedesSociais(BaseModel):
    total_registros: int
    maior_crescimento_instagram: Optional[int] = None
    maior_crescimento_telegram: Optional[int] = None
    maior_crescimento_whatsapp: Optional[int] = None
    maior_crescimento_facebook: Optional[int] = None
    maior_crescimento_youtube: Optional[int] = None
    maior_crescimento_tiktok: Optional[int] = None
    total_seguidores_instagram: Optional[int] = None
    total_inscritos_telegram: Optional[int] = None
    total_leads_whatsapp: Optional[int] = None
    total_seguidores_facebook: Optional[int] = None
    total_inscritos_youtube: Optional[int] = None
    total_seguidores_tiktok: Optional[int] = None


class FiltroMetricasRedesSociais(BaseModel):
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    projeto_id: Optional[uuid.UUID] = None 