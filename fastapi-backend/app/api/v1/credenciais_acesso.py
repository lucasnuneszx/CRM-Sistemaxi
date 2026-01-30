from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from ...core.database import get_db
from ...services.credencial_acesso_service import CredencialAcessoService
from ...schemas.credencial_acesso import (
    CredencialAcessoCreate,
    CredencialAcessoUpdate,
    CredencialAcessoResponse,
    CredencialAcessoListResponse,
    PLATAFORMAS_DISPONIVEIS,
    PlataformaOption
)
from ..deps import get_current_user
from ...models.user import User

router = APIRouter()


@router.post("/", response_model=CredencialAcessoResponse, status_code=status.HTTP_201_CREATED)
def create_credencial(
    credencial: CredencialAcessoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar uma nova credencial de acesso"""
    service = CredencialAcessoService(db)
    
    try:
        new_credencial = service.create_credencial(credencial)
        # Mascarar a senha no response
        response_data = CredencialAcessoResponse.model_validate(new_credencial)
        return response_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar credencial: {str(e)}"
        )


@router.get("/projeto/{projeto_id}", response_model=List[CredencialAcessoListResponse])
def list_credenciais_projeto(
    projeto_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    apenas_ativas: bool = Query(True),
    busca: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar credenciais de um projeto"""
    service = CredencialAcessoService(db)
    
    if busca:
        credenciais = service.search_credenciais(
            projeto_id=projeto_id,
            termo=busca,
            skip=skip,
            limit=limit
        )
    else:
        credenciais = service.get_credenciais_by_projeto(
            projeto_id=projeto_id,
            skip=skip,
            limit=limit,
            apenas_ativas=apenas_ativas
        )
    
    return [CredencialAcessoListResponse.model_validate(c) for c in credenciais]


@router.get("/{credencial_id}", response_model=CredencialAcessoResponse)
def get_credencial(
    credencial_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Buscar credencial por ID"""
    service = CredencialAcessoService(db)
    credencial = service.get_credencial_by_id(credencial_id)
    
    if not credencial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credencial não encontrada"
        )
    
    return CredencialAcessoResponse.model_validate(credencial)


@router.put("/{credencial_id}", response_model=CredencialAcessoResponse)
def update_credencial(
    credencial_id: uuid.UUID,
    credencial_update: CredencialAcessoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar uma credencial"""
    service = CredencialAcessoService(db)
    credencial = service.update_credencial(credencial_id, credencial_update)
    
    if not credencial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credencial não encontrada"
        )
    
    return CredencialAcessoResponse.model_validate(credencial)


@router.delete("/{credencial_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_credencial(
    credencial_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar uma credencial"""
    service = CredencialAcessoService(db)
    success = service.delete_credencial(credencial_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credencial não encontrada"
        )


@router.patch("/{credencial_id}/toggle-ativo", response_model=CredencialAcessoResponse)
def toggle_ativo(
    credencial_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Alternar status ativo/inativo da credencial"""
    service = CredencialAcessoService(db)
    credencial = service.toggle_ativo(credencial_id)
    
    if not credencial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credencial não encontrada"
        )
    
    return CredencialAcessoResponse.model_validate(credencial)


@router.get("/plataformas/disponiveis", response_model=List[PlataformaOption])
def get_plataformas_disponiveis():
    """Obter lista de plataformas disponíveis"""
    return PLATAFORMAS_DISPONIVEIS 