from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ....core.database import get_db
from ....models.user import User
from ....api.deps import get_current_active_user
from ....schemas.setor import SetorCreate, SetorUpdate, SetorResponse
from ....services.setor_service import SetorService

router = APIRouter()


@router.get("/", response_model=List[SetorResponse])
@router.get("", response_model=List[SetorResponse])
def read_setores(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all setores"""
    setores = SetorService.get_setores(db, skip=skip, limit=limit)
    return setores


@router.get("/{setor_id}", response_model=SetorResponse)
def read_setor(
    setor_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get setor by ID"""
    setor = SetorService.get_setor(db, setor_id=setor_id)
    if setor is None:
        raise HTTPException(status_code=404, detail="Setor not found")
    return setor


@router.post("/", response_model=SetorResponse, status_code=status.HTTP_201_CREATED)
def create_setor(
    setor: SetorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create new setor (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create setores"
        )
    
    new_setor = SetorService.create_setor(db, setor=setor)
    return new_setor


@router.put("/{setor_id}", response_model=SetorResponse)
def update_setor(
    setor_id: uuid.UUID,
    setor_update: SetorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update setor (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update setores"
        )
    
    setor = SetorService.get_setor(db, setor_id=setor_id)
    if setor is None:
        raise HTTPException(status_code=404, detail="Setor not found")
    
    updated_setor = SetorService.update_setor(
        db, setor_id=setor_id, setor_update=setor_update
    )
    return updated_setor


@router.delete("/{setor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_setor(
    setor_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete setor (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete setores"
        )
    
    setor = SetorService.get_setor(db, setor_id=setor_id)
    if setor is None:
        raise HTTPException(status_code=404, detail="Setor not found")
    
    success = SetorService.delete_setor(db, setor_id=setor_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete setor") 