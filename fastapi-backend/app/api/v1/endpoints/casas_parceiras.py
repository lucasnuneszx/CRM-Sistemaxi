from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from ....core.database import get_db
from ....schemas.casa_parceira import (
    CasaParceiraCreate, 
    CasaParceiraResponse, 
    CasaParceiraUpdate,
    LinkRequest,
    LinkResponse
)
from ....services.casa_parceira_service import CasaParceiraService
from ....services.project_service import ProjectService
from ....models.user import User
from ...deps import get_current_active_user

router = APIRouter()


@router.get("/projeto/{projeto_id}", response_model=List[CasaParceiraResponse])
def get_casas_by_projeto(
    projeto_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all casas parceiras for a project - accessible to all authenticated users"""
    # Verificar se o projeto existe
    projeto = ProjectService.get_project(db, project_id=projeto_id)
    if not projeto:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # All authenticated users can access casas parceiras
    casas = CasaParceiraService.get_casas_by_projeto(db, projeto_id=projeto_id)
    return casas


@router.get("/{casa_id}", response_model=CasaParceiraResponse)
def get_casa_by_id(
    casa_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get casa parceira by ID - accessible to all authenticated users"""
    casa = CasaParceiraService.get_casa_by_id(db, casa_id=casa_id)
    if not casa:
        raise HTTPException(status_code=404, detail="Casa parceira not found")
    
    # All authenticated users can access casas parceiras
    return casa


@router.post("/", response_model=CasaParceiraResponse)
def create_casa(
    casa: CasaParceiraCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create new casa parceira"""
    # Verificar se o usuário tem acesso ao projeto
    projeto = ProjectService.get_project(db, project_id=casa.projeto_id)
    if not projeto:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if projeto.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Verificar se slug é único
    existing_casa = CasaParceiraService.get_casa_by_slug(db, slug=casa.slug)
    if existing_casa:
        raise HTTPException(
            status_code=400,
            detail="Slug already exists"
        )
    
    return CasaParceiraService.create_casa(db=db, casa=casa)


@router.put("/{casa_id}", response_model=CasaParceiraResponse)
def update_casa(
    casa_id: UUID,
    casa_update: CasaParceiraUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update casa parceira"""
    casa = CasaParceiraService.get_casa_by_id(db, casa_id=casa_id)
    if not casa:
        raise HTTPException(status_code=404, detail="Casa parceira not found")
    
    # Verificar permissões
    if casa.projeto.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Verificar slug único se está sendo alterado
    if casa_update.slug and casa_update.slug != casa.slug:
        existing_casa = CasaParceiraService.get_casa_by_slug(db, slug=casa_update.slug)
        if existing_casa:
            raise HTTPException(
                status_code=400,
                detail="Slug already exists"
            )
    
    updated_casa = CasaParceiraService.update_casa(db, casa_id=casa_id, casa_update=casa_update)
    return updated_casa


@router.delete("/{casa_id}")
def delete_casa(
    casa_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete casa parceira"""
    casa = CasaParceiraService.get_casa_by_id(db, casa_id=casa_id)
    if not casa:
        raise HTTPException(status_code=404, detail="Casa parceira not found")
    
    # Verificar permissões
    if casa.projeto.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    success = CasaParceiraService.delete_casa(db, casa_id=casa_id)
    if not success:
        raise HTTPException(status_code=404, detail="Casa parceira not found")
    
    return {"message": "Casa parceira deleted successfully"}


@router.post("/{casa_id}/generate-link", response_model=LinkResponse)
def generate_link(
    casa_id: UUID,
    link_request: LinkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate affiliate link with UTM parameters"""
    casa = CasaParceiraService.get_casa_by_id(db, casa_id=casa_id)
    if not casa:
        raise HTTPException(status_code=404, detail="Casa parceira not found")
    
    # Verificar permissões
    if casa.projeto.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    if not casa.ativo:
        raise HTTPException(
            status_code=400,
            detail="Casa parceira is not active"
        )
    
    result = CasaParceiraService.generate_link(casa, link_request)
    return LinkResponse(**result)


# Endpoint público para gerar links (usado pelo slug)
@router.post("/public/{slug}/generate-link", response_model=LinkResponse)
def generate_link_public(
    slug: str,
    link_request: LinkRequest,
    db: Session = Depends(get_db)
):
    """Generate affiliate link publicly using slug"""
    casa = CasaParceiraService.get_casa_by_slug(db, slug=slug)
    if not casa:
        raise HTTPException(status_code=404, detail="Casa parceira not found")
    
    if not casa.ativo:
        raise HTTPException(
            status_code=400,
            detail="Casa parceira is not active"
        )
    
    result = CasaParceiraService.generate_link(casa, link_request)
    return LinkResponse(**result) 