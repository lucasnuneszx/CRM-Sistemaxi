from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ....core.database import get_db
from ....api.deps import get_current_user
from ....models.user import User
from ....schemas.user_project import UserProjectAssignment, UserProjectResponse
from ....schemas.user import UserResponse
from ....schemas.project import ProjectResponse
from ....services.user_project_service import UserProjectService

router = APIRouter()


def serialize_user_project(user_project, db: Session = None) -> UserProjectResponse:
    """Serialize UserProject ORM object to UserProjectResponse"""
    # Serialize user if available
    user_dict = None
    if user_project.user:
        user_response = UserResponse.model_validate(user_project.user)
        user_dict = user_response.model_dump()
    
    # Serialize project if available - usar a mesma lógica do endpoint de projetos
    project_dict = None
    if user_project.project:
        # Importar a função serialize_project do endpoint de projetos
        from .projects import serialize_project
        
        # Se temos acesso ao db, recarregar com relacionamentos
        if db:
            from sqlalchemy.orm import joinedload
            from ....models.project import Project
            project_with_relations = db.query(Project).options(
                joinedload(Project.owner)
            ).filter(Project.id == user_project.project.id).first()
            
            if project_with_relations:
                project_response = serialize_project(project_with_relations)
                project_dict = project_response.model_dump()
        
        # Fallback: serializar sem relacionamentos se não conseguir carregar
        if not project_dict:
            # Criar um dict manualmente sem o owner para evitar erro
            project_dict = {
                "id": user_project.project.id,
                "name": user_project.project.name,
                "description": user_project.project.description,
                "status": user_project.project.status,
                "startDate": user_project.project.startDate,
                "endDate": user_project.project.endDate,
                "budget": user_project.project.budget,
                "owner_id": user_project.project.owner_id,
                "created_at": user_project.project.created_at,
                "updated_at": user_project.project.updated_at,
                "atividades": [],
                "owner": None,  # Não incluir owner para evitar erro de serialização
                "cliente": None
            }
    
    return UserProjectResponse(
        id=user_project.id,
        user_id=user_project.user_id,
        project_id=user_project.project_id,
        role=user_project.role,
        user=user_dict,
        project=project_dict
    )


@router.post("/projects/{project_id}/users", response_model=UserProjectResponse)
def assign_user_to_project(
    project_id: UUID,
    assignment: UserProjectAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atribuir usuário a um projeto (apenas admins e project managers)"""
    # Verificar se o usuário atual pode gerenciar este projeto
    if not UserProjectService.user_can_manage_project(db, current_user.id, project_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para gerenciar este projeto"
        )
    
    try:
        user_project = UserProjectService.assign_user_to_project(
            db, assignment.user_id, project_id, assignment.role
        )
        
        return serialize_user_project(user_project, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atribuir usuário ao projeto: {str(e)}"
        )


@router.delete("/projects/{project_id}/users/{user_id}")
def remove_user_from_project(
    project_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remover usuário de um projeto (apenas admins e project managers)"""
    # Verificar se o usuário atual pode gerenciar este projeto
    if not UserProjectService.user_can_manage_project(db, current_user.id, project_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para gerenciar este projeto"
        )
    
    success = UserProjectService.remove_user_from_project(db, user_id, project_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Atribuição não encontrada"
        )
    
    return {"message": "Usuário removido do projeto com sucesso"}


@router.get("/projects/{project_id}/users", response_model=List[UserProjectResponse])
def get_project_users(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar usuários de um projeto"""
    # Verificar se o usuário tem acesso ao projeto
    if not UserProjectService.user_has_access_to_project(db, current_user.id, project_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem acesso a este projeto"
        )
    
    user_projects = UserProjectService.get_project_users(db, project_id)
    return [serialize_user_project(up, db) for up in user_projects]


@router.get("/users/{user_id}/projects", response_model=List[UserProjectResponse])
def get_user_projects(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar projetos de um usuário (apenas próprio usuário ou admins)"""
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para ver projetos de outros usuários"
        )
    
    user_projects = UserProjectService.get_user_projects(db, user_id)
    result = []
    for up in user_projects:
        response = UserProjectResponse(
            id=up.id,
            user_id=up.user_id,
            project_id=up.project_id,
            role=up.role,
            user=None,
            project=None
        )
        result.append(response)
    return result


@router.get("", response_model=List[UserProjectResponse])
def get_my_projects_root(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar meus projetos (raiz)"""
    user_projects = UserProjectService.get_user_projects(db, current_user.id)
    result = []
    for up in user_projects:
        response = UserProjectResponse(
            id=up.id,
            user_id=up.user_id,
            project_id=up.project_id,
            role=up.role,
            user=None,
            project=None
        )
        result.append(response)
    return result


@router.get("/users/me/projects", response_model=List[UserProjectResponse])
def get_my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar meus projetos"""
    user_projects = UserProjectService.get_user_projects(db, current_user.id)
    result = []
    for up in user_projects:
        response = UserProjectResponse(
            id=up.id,
            user_id=up.user_id,
            project_id=up.project_id,
            role=up.role,
            user=None,
            project=None
        )
        result.append(response)
    return result 