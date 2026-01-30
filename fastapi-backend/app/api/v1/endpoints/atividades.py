from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from ....core.database import get_db
from ....schemas.atividade import AtividadeCreate, AtividadeResponse, AtividadeUpdate
from ....services.atividade_service import AtividadeService
from ....models.user import User
from ...deps import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[AtividadeResponse])
@router.get("", response_model=List[AtividadeResponse])  # Route without trailing slash
def read_atividades(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get atividades for current user"""
    atividades = AtividadeService.get_atividades(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return atividades


@router.get("/projeto/{projeto_id}", response_model=List[AtividadeResponse])
def read_atividades_by_projeto(
    projeto_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get atividades by projeto ID - accessible to all authenticated users"""
    from ....models.project import Project
    
    # Check if project exists
    projeto = db.query(Project).filter(Project.id == projeto_id).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto not found")
    
    # All authenticated users can access atividades
    from ....models.atividade import Atividade
    atividades = db.query(Atividade).filter(Atividade.projeto_id == projeto_id).all()
    return atividades


@router.get("/{atividade_id}", response_model=AtividadeResponse)
def read_atividade(
    atividade_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get atividade by ID - accessible to all authenticated users"""
    atividade = AtividadeService.get_atividade(db, atividade_id=atividade_id)
    if atividade is None:
        raise HTTPException(status_code=404, detail="Atividade not found")
    
    # All authenticated users can access atividades
    return atividade


@router.post("/", response_model=AtividadeResponse)
@router.post("", response_model=AtividadeResponse)  # Route without trailing slash
def create_atividade(
    atividade: AtividadeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create new atividade"""
    return AtividadeService.create_atividade(db=db, atividade=atividade)


@router.put("/{atividade_id}", response_model=AtividadeResponse)
def update_atividade(
    atividade_id: UUID,
    atividade_update: AtividadeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update atividade - accessible to all authenticated users"""
    # Check if atividade exists
    atividade = AtividadeService.get_atividade(db, atividade_id=atividade_id)
    if atividade is None:
        raise HTTPException(status_code=404, detail="Atividade not found")
    
    # All authenticated users can update atividades
    updated_atividade = AtividadeService.update_atividade(
        db, atividade_id=atividade_id, atividade_update=atividade_update
    )
    return updated_atividade


@router.delete("/{atividade_id}")
def delete_atividade(
    atividade_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete atividade - accessible to all authenticated users"""
    # Check if atividade exists
    atividade = AtividadeService.get_atividade(db, atividade_id=atividade_id)
    if atividade is None:
        raise HTTPException(status_code=404, detail="Atividade not found")
    
    # All authenticated users can delete atividades
    success = AtividadeService.delete_atividade(db, atividade_id=atividade_id)
    if not success:
        raise HTTPException(status_code=404, detail="Atividade not found")
    
    return {"message": "Atividade deleted successfully"} 