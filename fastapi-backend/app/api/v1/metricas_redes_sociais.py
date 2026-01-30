from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import uuid

from ...core.database import get_db
from ...services.metricas_redes_sociais_service import MetricasRedesSociaisService
from ...schemas.metricas_redes_sociais import (
    MetricasRedesSociaisCreate,
    MetricasRedesSociaisUpdate,
    MetricasRedesSociaisResponse,
    EstatisticasRedesSociais,
    FiltroMetricasRedesSociais
)
from ..deps import get_current_user
from ...models.user import User

router = APIRouter()


@router.post("/", response_model=MetricasRedesSociaisResponse, status_code=status.HTTP_201_CREATED)
def create_metricas(
    metricas: MetricasRedesSociaisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar novas métricas de redes sociais"""
    service = MetricasRedesSociaisService(db)
    
    # Verificar se já existe métricas para essa data
    existing = service.get_metricas_by_projeto_and_data(
        metricas.projeto_id, 
        metricas.data_referente
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Já existem métricas para a data {metricas.data_referente}"
        )
    
    return service.create_metricas(metricas)


@router.get("/{metricas_id}", response_model=MetricasRedesSociaisResponse)
def get_metricas(
    metricas_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Buscar métricas por ID"""
    service = MetricasRedesSociaisService(db)
    metricas = service.get_metricas_by_id(metricas_id)
    
    if not metricas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Métricas não encontradas"
        )
    
    return metricas


@router.get("/projeto/{projeto_id}", response_model=List[MetricasRedesSociaisResponse])
def list_metricas_projeto(
    projeto_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar métricas de um projeto com filtros opcionais"""
    service = MetricasRedesSociaisService(db)
    
    filtro = FiltroMetricasRedesSociais(
        data_inicio=data_inicio,
        data_fim=data_fim,
        projeto_id=projeto_id
    )
    
    return service.get_metricas_by_projeto(
        projeto_id=projeto_id,
        skip=skip,
        limit=limit,
        filtro=filtro
    )


@router.put("/{metricas_id}", response_model=MetricasRedesSociaisResponse)
def update_metricas(
    metricas_id: uuid.UUID,
    metricas_update: MetricasRedesSociaisUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar métricas existentes"""
    service = MetricasRedesSociaisService(db)
    metricas = service.update_metricas(metricas_id, metricas_update)
    
    if not metricas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Métricas não encontradas"
        )
    
    return metricas


@router.delete("/{metricas_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_metricas(
    metricas_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar métricas"""
    service = MetricasRedesSociaisService(db)
    success = service.delete_metricas(metricas_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Métricas não encontradas"
        )


@router.get("/projeto/{projeto_id}/estatisticas", response_model=EstatisticasRedesSociais)
def get_estatisticas_projeto(
    projeto_id: uuid.UUID,
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter estatísticas de redes sociais de um projeto"""
    service = MetricasRedesSociaisService(db)
    
    filtro = FiltroMetricasRedesSociais(
        data_inicio=data_inicio,
        data_fim=data_fim,
        projeto_id=projeto_id
    )
    
    return service.get_estatisticas_projeto(projeto_id, filtro)


@router.get("/projeto/{projeto_id}/periodo", response_model=List[MetricasRedesSociaisResponse])
def get_metricas_periodo(
    projeto_id: uuid.UUID,
    data_inicio: date = Query(..., description="Data de início do período"),
    data_fim: date = Query(..., description="Data de fim do período"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Buscar métricas em um período específico"""
    service = MetricasRedesSociaisService(db)
    
    if data_inicio > data_fim:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data de início deve ser anterior à data de fim"
        )
    
    return service.get_metricas_periodo(projeto_id, data_inicio, data_fim)


@router.get("/projeto/{projeto_id}/ultimas", response_model=List[MetricasRedesSociaisResponse])
def get_ultimas_metricas(
    projeto_id: uuid.UUID,
    limit: int = Query(7, ge=1, le=30, description="Número de métricas a retornar"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Buscar as últimas N métricas de um projeto"""
    service = MetricasRedesSociaisService(db)
    return service.get_ultimas_metricas(projeto_id, limit)


@router.get("/projeto/{projeto_id}/check-data/{data_referente}")
def check_metricas_data(
    projeto_id: uuid.UUID,
    data_referente: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verificar se já existem métricas para uma data específica"""
    service = MetricasRedesSociaisService(db)
    existing = service.get_metricas_by_projeto_and_data(projeto_id, data_referente)
    
    return {
        "exists": existing is not None,
        "metricas_id": existing.id if existing else None
    } 