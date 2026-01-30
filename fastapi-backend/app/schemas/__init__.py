from .auth import Token, TokenData, LoginRequest
from .user import UserResponse, UserCreate, UserUpdate, UserBase
from .project import ProjectResponse, ProjectCreate, ProjectUpdate, ProjectBase
from .atividade import (AtividadeResponse, AtividadeCreate, AtividadeUpdate, AtividadeBase, 
                        ProjetoNested, UserNested, SetorNested)
from .setor import SetorResponse, SetorCreate, SetorUpdate, SetorBase
from .documento import DocumentoBase, DocumentoCreate, DocumentoUpdate, DocumentoResponse, DownloadURL
from .criativo import (CriativoResponse, CriativoCreate, CriativoUpdate, CriativoBase,
                       CriativoKanban, CriativosKanbanResponse, CriativosStats,
                       StatusCriativo, PrioridadeCriativo, TipoArquivo)
from .lead import LeadResponse, LeadCreate, LeadUpdate, LeadBase
from .kanban_column import KanbanColumnResponse, KanbanColumnCreate, KanbanColumnUpdate, KanbanColumnBase
from .cliente import ClienteResponse, ClienteCreate, ClienteUpdate, ClienteBase
from .proposta import PropostaResponse, PropostaCreate, PropostaUpdate, PropostaBase, ResponsavelNested, ClienteNested

__all__ = [
    "UserResponse", "UserCreate", "UserUpdate", "UserBase",
    "ProjectResponse", "ProjectCreate", "ProjectUpdate", "ProjectBase",
    "AtividadeResponse", "AtividadeCreate", "AtividadeUpdate", "AtividadeBase",
    "ProjetoNested", "UserNested", "SetorNested",
    "SetorResponse", "SetorCreate", "SetorUpdate", "SetorBase",
    "Token", "TokenData", "LoginRequest",
    "DocumentoBase", "DocumentoCreate", "DocumentoUpdate", "DocumentoResponse",
    "DownloadURL",
    "CriativoResponse", "CriativoCreate", "CriativoUpdate", "CriativoBase",
    "CriativoKanban", "CriativosKanbanResponse", "CriativosStats",
    "StatusCriativo", "PrioridadeCriativo", "TipoArquivo",
    "LeadResponse", "LeadCreate", "LeadUpdate", "LeadBase",
    "KanbanColumnResponse", "KanbanColumnCreate", "KanbanColumnUpdate", "KanbanColumnBase",
    "ClienteResponse", "ClienteCreate", "ClienteUpdate", "ClienteBase",
    "PropostaResponse", "PropostaCreate", "PropostaUpdate", "PropostaBase",
    "ResponsavelNested", "ClienteNested"
]

# Resolve forward references
ProjectResponse.model_rebuild()
AtividadeResponse.model_rebuild()
DocumentoResponse.model_rebuild()
ProjetoNested.model_rebuild()
UserNested.model_rebuild()
SetorNested.model_rebuild()
UserResponse.model_rebuild()
SetorResponse.model_rebuild()
CriativoResponse.model_rebuild()

# Import after all schemas are defined to resolve forward references
from .lead import LeadResponse
from .kanban_column import KanbanColumnResponse

# Rebuild models with forward references
KanbanColumnResponse.model_rebuild()

# No need to print here anymore, was for initial debugging
# print("Schemas rebuilt") 