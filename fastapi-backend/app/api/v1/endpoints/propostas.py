from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from ....core.database import get_db
from ....schemas.proposta import PropostaCreate, PropostaResponse, PropostaUpdate
from ....services.proposta_service import PropostaService
from ....models.user import User
from ...deps import get_current_active_user

router = APIRouter()


class ReorderPropostasRequest(BaseModel):
    propostas: List[dict]  # [{"id": "uuid", "ordem": 0, "prioridade": 0}]


@router.get("/", response_model=List[PropostaResponse])
@router.get("", response_model=List[PropostaResponse])
def read_propostas(
    skip: int = 0,
    limit: int = 100,
    cliente_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all propostas"""
    propostas = PropostaService.get_propostas(db, skip=skip, limit=limit, cliente_id=cliente_id)
    return propostas


@router.get("/{proposta_id}", response_model=PropostaResponse)
def read_proposta(
    proposta_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get proposta by ID"""
    proposta = PropostaService.get_proposta(db, proposta_id=proposta_id)
    if proposta is None:
        raise HTTPException(status_code=404, detail="Proposta not found")
    return proposta


@router.post("/", response_model=PropostaResponse)
@router.post("", response_model=PropostaResponse)
def create_proposta(
    proposta: PropostaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create new proposta"""
    return PropostaService.create_proposta(db=db, proposta=proposta)


@router.put("/{proposta_id}", response_model=PropostaResponse)
def update_proposta(
    proposta_id: UUID,
    proposta_update: PropostaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update proposta"""
    proposta = PropostaService.get_proposta(db, proposta_id=proposta_id)
    if proposta is None:
        raise HTTPException(status_code=404, detail="Proposta not found")
    
    updated_proposta = PropostaService.update_proposta(db, proposta_id=proposta_id, proposta_update=proposta_update)
    return updated_proposta


@router.delete("/{proposta_id}")
def delete_proposta(
    proposta_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete proposta"""
    proposta = PropostaService.get_proposta(db, proposta_id=proposta_id)
    if proposta is None:
        raise HTTPException(status_code=404, detail="Proposta not found")
    
    success = PropostaService.delete_proposta(db, proposta_id=proposta_id)
    if not success:
        raise HTTPException(status_code=404, detail="Proposta not found")
    
    return {"message": "Proposta deleted successfully"}


@router.post("/reorder", response_model=List[PropostaResponse])
def reorder_propostas(
    request: ReorderPropostasRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reorder propostas"""
    propostas = PropostaService.reorder_propostas(db, request.propostas)
    return propostas


