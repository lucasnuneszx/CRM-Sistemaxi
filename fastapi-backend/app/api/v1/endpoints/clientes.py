from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import logging
from ....core.database import get_db
from ....schemas.cliente import ClienteCreate, ClienteResponse, ClienteUpdate
from ....services.cliente_service import ClienteService
from ....models.user import User
from ...deps import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=List[ClienteResponse])
@router.get("", response_model=List[ClienteResponse])
def read_clientes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all clientes"""
    clientes = ClienteService.get_clientes(db, skip=skip, limit=limit)
    return clientes


@router.get("/{cliente_id}", response_model=ClienteResponse)
def read_cliente(
    cliente_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get cliente by ID"""
    cliente = ClienteService.get_cliente(db, cliente_id=cliente_id)
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente not found")
    return cliente


@router.get("/cpf/{cpf}", response_model=ClienteResponse)
def read_cliente_by_cpf(
    cpf: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get cliente by CPF"""
    cliente = ClienteService.get_cliente_by_cpf(db, cpf=cpf)
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente not found")
    return cliente


@router.post("/", response_model=ClienteResponse)
@router.post("", response_model=ClienteResponse)
def create_cliente(
    cliente: ClienteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create new cliente"""
    try:
        result = ClienteService.create_cliente(db=db, cliente=cliente)
        return result
    except Exception as e:
        logger.error(f"Erro ao criar cliente: {e}")
        raise


@router.put("/{cliente_id}", response_model=ClienteResponse)
def update_cliente(
    cliente_id: UUID,
    cliente_update: ClienteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update cliente"""
    cliente = ClienteService.get_cliente(db, cliente_id=cliente_id)
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente not found")
    
    updated_cliente = ClienteService.update_cliente(db, cliente_id=cliente_id, cliente_update=cliente_update)
    return updated_cliente


@router.delete("/{cliente_id}")
def delete_cliente(
    cliente_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete cliente"""
    cliente = ClienteService.get_cliente(db, cliente_id=cliente_id)
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente not found")
    
    success = ClienteService.delete_cliente(db, cliente_id=cliente_id)
    if not success:
        raise HTTPException(status_code=404, detail="Cliente not found")
    
    return {"message": "Cliente deleted successfully"}

