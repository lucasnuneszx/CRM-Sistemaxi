from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
import uuid


class RelatorioDiarioBase(BaseModel):
    data_referente: date
    
    # Atividades realizadas
    criacao_criativos: bool = False
    identidade_visual: bool = False
    outras_atividades: Optional[str] = None
    atividades_realizadas_ids: Optional[List[uuid.UUID]] = []
    
    # Métricas de investimento
    valor_investido: Optional[Decimal] = Field(None, ge=0, description="Valor investido em R$")
    
    # Métricas de leads
    leads: Optional[int] = Field(None, ge=0, description="Número de leads")
    custo_por_lead: Optional[Decimal] = Field(None, ge=0, description="Custo por lead em R$")
    
    # Métricas de registros
    registros: Optional[int] = Field(None, ge=0, description="Número de registros")
    custo_por_registro: Optional[Decimal] = Field(None, ge=0, description="Custo por registro em R$")
    
    # Métricas de depósito
    deposito: Optional[Decimal] = Field(None, ge=0, description="Valor de depósito em R$")
    
    # Métricas de FTD
    ftd: Optional[int] = Field(None, ge=0, description="Número de FTDs")
    custo_por_ftd: Optional[Decimal] = Field(None, ge=0, description="Custo por FTD em R$")
    valor_ftd: Optional[Decimal] = Field(None, ge=0, description="Valor de FTD em R$")
    
    # Métricas de CPA
    cpa: Optional[int] = Field(None, ge=0, description="Número de CPAs")
    comissao_cpa: Optional[Decimal] = Field(None, ge=0, description="Comissão CPA em R$")
    
    # Revshare
    revshare: Optional[Decimal] = Field(None, description="Revshare em R$")
    
    # Total de comissão
    total_comissao_dia: Optional[Decimal] = Field(None, description="Total de comissão do dia em R$")
    
    # Observações
    observacoes: Optional[str] = None


class RelatorioDiarioCreate(RelatorioDiarioBase):
    projeto_id: uuid.UUID


class RelatorioDiarioUpdate(BaseModel):
    data_referente: Optional[date] = None
    
    # Atividades realizadas
    criacao_criativos: Optional[bool] = None
    identidade_visual: Optional[bool] = None
    outras_atividades: Optional[str] = None
    atividades_realizadas_ids: Optional[List[uuid.UUID]] = None
    
    # Métricas de investimento
    valor_investido: Optional[Decimal] = Field(None, ge=0)
    
    # Métricas de leads
    leads: Optional[int] = Field(None, ge=0)
    custo_por_lead: Optional[Decimal] = Field(None, ge=0)
    
    # Métricas de registros
    registros: Optional[int] = Field(None, ge=0)
    custo_por_registro: Optional[Decimal] = Field(None, ge=0)
    
    # Métricas de depósito
    deposito: Optional[Decimal] = Field(None, ge=0)
    
    # Métricas de FTD
    ftd: Optional[int] = Field(None, ge=0)
    custo_por_ftd: Optional[Decimal] = Field(None, ge=0)
    valor_ftd: Optional[Decimal] = Field(None, ge=0)
    
    # Métricas de CPA
    cpa: Optional[int] = Field(None, ge=0)
    comissao_cpa: Optional[Decimal] = Field(None, ge=0)
    
    # Revshare
    revshare: Optional[Decimal] = Field(None)
    
    # Total de comissão
    total_comissao_dia: Optional[Decimal] = Field(None)
    
    # Observações
    observacoes: Optional[str] = None


# Schema para atividade simplificada
class AtividadeSimples(BaseModel):
    id: uuid.UUID
    nome: str
    status: str
    
    class Config:
        from_attributes = True


class RelatorioDiarioResponse(RelatorioDiarioBase):
    id: uuid.UUID
    projeto_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    atividades_realizadas: Optional[List[AtividadeSimples]] = []

    class Config:
        from_attributes = True


# Schema para estatísticas/resumos
class EstatisticasRelatorio(BaseModel):
    total_relatorios: int
    total_valor_investido: Decimal
    total_leads: int
    total_registros: int
    total_deposito: Decimal
    total_ftd: int
    total_comissao: Decimal
    media_custo_por_lead: Optional[Decimal] = None
    media_custo_por_registro: Optional[Decimal] = None
    media_custo_por_ftd: Optional[Decimal] = None


# Schema para filtros
class FiltroRelatorio(BaseModel):
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    projeto_id: Optional[uuid.UUID] = None 