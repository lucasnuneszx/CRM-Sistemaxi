from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel

from ....core.database import get_db
from ....api.deps import get_current_user
from ....models.user import User
from ....schemas.lead import LeadCreate, LeadUpdate, LeadResponse, LeadStage
from ....services.lead_service import LeadService


class MoveLeadRequest(BaseModel):
    column_id: Optional[UUID] = None
    new_index: Optional[int] = None

router = APIRouter()


@router.post("", response_model=LeadResponse)
async def create_lead(
    lead: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar novo lead"""
    service = LeadService(db)
    return service.create_lead(lead, current_user.id)


@router.get("", response_model=List[LeadResponse])
async def get_leads(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar leads do usuário"""
    service = LeadService(db)
    return service.get_leads(current_user.id, skip, limit)


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Buscar lead específico"""
    service = LeadService(db)
    lead = service.get_lead(lead_id, current_user.id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead não encontrado")
    return lead


@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: UUID,
    lead: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar lead"""
    service = LeadService(db)
    updated = service.update_lead(lead_id, lead, current_user.id)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead não encontrado")
    return updated


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar lead"""
    service = LeadService(db)
    if not service.delete_lead(lead_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead não encontrado")
    return {"message": "Lead deletado com sucesso"}


@router.patch("/{lead_id}/move", response_model=LeadResponse)
@router.post("/{lead_id}/move", response_model=LeadResponse)  # Suporte para POST também
async def move_lead(
    lead_id: UUID,
    move_data: MoveLeadRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mover lead para uma coluna"""
    service = LeadService(db)
    updated = service.move_lead(lead_id, move_data.column_id, current_user.id)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead não encontrado")
    return updated
