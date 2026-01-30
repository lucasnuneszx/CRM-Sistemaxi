from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class StatusCriativo(str, Enum):
    MATERIAL_CRU = "material_cru"
    EM_EDICAO = "em_edicao"
    AGUARDANDO_REVISAO = "aguardando_revisao"
    APROVADO = "aprovado"
    REJEITADO = "rejeitado"


class PrioridadeCriativo(str, Enum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    URGENTE = "urgente"


class TipoArquivo(str, Enum):
    IMAGEM = "IMAGEM"
    VIDEO = "VIDEO"
    AUDIO = "AUDIO"
    DOCUMENTO = "DOCUMENTO"


# Mapeamento de prioridade
PRIORIDADE_MAP = {
    1: PrioridadeCriativo.BAIXA,
    2: PrioridadeCriativo.MEDIA,
    3: PrioridadeCriativo.ALTA,
    4: PrioridadeCriativo.URGENTE
}

PRIORIDADE_REVERSE_MAP = {v: k for k, v in PRIORIDADE_MAP.items()}


class CriativoBase(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        validate_assignment=True
    )
    
    nome: str = Field(..., alias="titulo")  # Frontend usa 'titulo', DB usa 'nome'
    descricao: Optional[str] = None
    tipo: TipoArquivo = Field(..., alias="tipo_arquivo")  # Frontend usa 'tipo_arquivo', DB usa 'tipo'
    projeto_id: Optional[UUID] = None  # Tornado opcional para criação de leads simples
    email: Optional[str] = None  # Email do lead/contato
    telefone: Optional[str] = None  # Telefone do lead/contato
    empresa: Optional[str] = None  # Empresa do lead/contato
    prioridade: PrioridadeCriativo = PrioridadeCriativo.MEDIA
    prazo: Optional[datetime] = None
    observacoes: Optional[str] = None


class CriativoCreate(CriativoBase):
    arquivo_cru_key: Optional[str] = Field(None, alias="arquivo_bruto_url")


class CriativoUpdate(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        validate_assignment=True
    )
    
    nome: Optional[str] = Field(None, alias="titulo")
    descricao: Optional[str] = None
    status: Optional[StatusCriativo] = None
    tipo: Optional[TipoArquivo] = Field(None, alias="tipo_arquivo")
    arquivo_cru_key: Optional[str] = Field(None, alias="arquivo_bruto_url")
    arquivo_editado_key: Optional[str] = Field(None, alias="arquivo_editado_url")
    editor_id: Optional[UUID] = Field(None, alias="editado_por_id")
    projeto_id: Optional[UUID] = None
    prioridade: Optional[PrioridadeCriativo] = None
    prazo: Optional[datetime] = None
    observacoes: Optional[str] = None


class CriativoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    titulo: str  # Propriedade virtual do modelo
    descricao: Optional[str] = None
    status: StatusCriativo
    tipo_arquivo: TipoArquivo  # Propriedade virtual do modelo
    arquivo_bruto_url: Optional[str] = None  # Propriedade virtual do modelo
    arquivo_editado_url: Optional[str] = None  # Propriedade virtual do modelo
    criado_por_id: UUID
    editado_por_id: Optional[UUID] = None  # Propriedade virtual do modelo
    projeto_id: UUID
    prioridade: PrioridadeCriativo
    prazo: Optional[datetime] = None
    observacoes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_orm_with_mapping(cls, orm_obj):
        """Converter objeto ORM com mapeamento de prioridade"""
        data = {}
        for field_name in cls.model_fields.keys():
            if hasattr(orm_obj, field_name):
                value = getattr(orm_obj, field_name)
                if field_name == 'prioridade' and isinstance(value, int):
                    value = PRIORIDADE_MAP.get(value, PrioridadeCriativo.MEDIA)
                data[field_name] = value
        return cls(**data)


class CriativoKanban(BaseModel):
    """Schema específico para visualização Kanban"""
    id: UUID
    titulo: str
    descricao: Optional[str] = None
    status: StatusCriativo
    tipo_arquivo: TipoArquivo
    prioridade: PrioridadeCriativo
    prazo: Optional[datetime] = None
    criado_por_id: UUID
    editado_por_id: Optional[UUID] = None
    projeto_id: UUID
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_orm_with_mapping(cls, orm_obj):
        """Converter objeto ORM com mapeamento de prioridade"""
        prioridade = PRIORIDADE_MAP.get(orm_obj.prioridade, PrioridadeCriativo.MEDIA)
        
        return cls(
            id=orm_obj.id,
            titulo=orm_obj.titulo,  # Propriedade virtual
            descricao=orm_obj.descricao,
            status=orm_obj.status,
            tipo_arquivo=orm_obj.tipo_arquivo,  # Propriedade virtual
            prioridade=prioridade,
            prazo=orm_obj.prazo,
            criado_por_id=orm_obj.criado_por_id,
            editado_por_id=orm_obj.editado_por_id,  # Propriedade virtual
            projeto_id=orm_obj.projeto_id,
            created_at=orm_obj.created_at,
            updated_at=orm_obj.updated_at
        )


class CriativosKanbanResponse(BaseModel):
    """Resposta completa do Kanban com criativos agrupados por status"""
    material_cru: List[CriativoKanban]
    em_edicao: List[CriativoKanban]
    aguardando_revisao: List[CriativoKanban]
    aprovado: List[CriativoKanban]
    rejeitado: List[CriativoKanban]


class CriativosStats(BaseModel):
    """Estatísticas dos criativos"""
    total: int
    material_cru: int
    em_edicao: int
    aguardando_revisao: int
    aprovado: int
    rejeitado: int 