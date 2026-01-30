from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import uuid

from ...core.database import get_db
from ...services.relatorio_diario_service import RelatorioDiarioService
from ...schemas.relatorio_diario import (
    RelatorioDiarioCreate,
    RelatorioDiarioUpdate,
    RelatorioDiarioResponse,
    EstatisticasRelatorio,
    FiltroRelatorio
)
from ..deps import get_current_user
from ...models.user import User

router = APIRouter()


@router.post("/", response_model=RelatorioDiarioResponse, status_code=status.HTTP_201_CREATED)
def create_relatorio(
    relatorio: RelatorioDiarioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar um novo relatório diário"""
    service = RelatorioDiarioService(db)
    
    # Verificar se já existe relatório para essa data
    existing = service.get_relatorio_by_projeto_and_data(
        relatorio.projeto_id, 
        relatorio.data_referente
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Já existe relatório para a data {relatorio.data_referente}"
        )
    
    return service.create_relatorio(relatorio)


@router.get("/{relatorio_id}", response_model=RelatorioDiarioResponse)
def get_relatorio(
    relatorio_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Buscar relatório por ID"""
    service = RelatorioDiarioService(db)
    relatorio = service.get_relatorio_by_id(relatorio_id)
    
    if not relatorio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relatório não encontrado"
        )
    
    return relatorio


@router.get("/projeto/{projeto_id}", response_model=List[RelatorioDiarioResponse])
def list_relatorios_projeto(
    projeto_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar relatórios de um projeto com filtros opcionais"""
    service = RelatorioDiarioService(db)
    
    filtro = FiltroRelatorio(
        data_inicio=data_inicio,
        data_fim=data_fim,
        projeto_id=projeto_id
    )
    
    return service.get_relatorios_by_projeto(
        projeto_id=projeto_id,
        skip=skip,
        limit=limit,
        filtro=filtro
    )


@router.put("/{relatorio_id}", response_model=RelatorioDiarioResponse)
def update_relatorio(
    relatorio_id: uuid.UUID,
    relatorio_update: RelatorioDiarioUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar um relatório existente"""
    service = RelatorioDiarioService(db)
    relatorio = service.update_relatorio(relatorio_id, relatorio_update)
    
    if not relatorio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relatório não encontrado"
        )
    
    return relatorio


@router.delete("/{relatorio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_relatorio(
    relatorio_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar um relatório"""
    service = RelatorioDiarioService(db)
    success = service.delete_relatorio(relatorio_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relatório não encontrado"
        )


@router.get("/projeto/{projeto_id}/estatisticas", response_model=EstatisticasRelatorio)
def get_estatisticas_projeto(
    projeto_id: uuid.UUID,
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter estatísticas consolidadas de um projeto"""
    service = RelatorioDiarioService(db)
    
    filtro = FiltroRelatorio(
        data_inicio=data_inicio,
        data_fim=data_fim,
        projeto_id=projeto_id
    )
    
    return service.get_estatisticas_projeto(projeto_id, filtro)


@router.get("/projeto/{projeto_id}/periodo", response_model=List[RelatorioDiarioResponse])
def get_relatorios_periodo(
    projeto_id: uuid.UUID,
    data_inicio: date = Query(..., description="Data de início do período"),
    data_fim: date = Query(..., description="Data de fim do período"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Buscar relatórios em um período específico"""
    service = RelatorioDiarioService(db)
    
    if data_inicio > data_fim:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data de início deve ser anterior à data de fim"
        )
    
    return service.get_relatorios_periodo(projeto_id, data_inicio, data_fim)


@router.get("/projeto/{projeto_id}/ultimos", response_model=List[RelatorioDiarioResponse])
def get_ultimos_relatorios(
    projeto_id: uuid.UUID,
    limit: int = Query(7, ge=1, le=30, description="Número de relatórios a retornar"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Buscar os últimos N relatórios de um projeto"""
    service = RelatorioDiarioService(db)
    return service.get_ultimos_relatorios(projeto_id, limit)


@router.get("/projeto/{projeto_id}/check-data/{data_referente}")
def check_relatorio_data(
    projeto_id: uuid.UUID,
    data_referente: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verificar se já existe relatório para uma data específica"""
    service = RelatorioDiarioService(db)
    existing = service.get_relatorio_by_projeto_and_data(projeto_id, data_referente)
    
    return {
        "exists": existing is not None,
        "relatorio_id": existing.id if existing else None
    }


@router.get("/dashboard/consolidado", response_model=dict)
def get_dashboard_consolidado(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    projeto_id: Optional[uuid.UUID] = Query(None, description="ID do projeto específico para filtrar"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter dados consolidados de todos os relatórios para o dashboard"""
    service = RelatorioDiarioService(db)
    return service.get_dashboard_consolidado(data_inicio, data_fim, projeto_id) 