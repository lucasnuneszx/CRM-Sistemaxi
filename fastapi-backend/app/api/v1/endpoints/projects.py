from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
import uuid
from ....core.database import get_db
from ....schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from ....schemas.user import UserResponse
from ....services.project_service import ProjectService
from ....models.user import User
from ....models.project import Project
from ...deps import get_current_active_user

router = APIRouter()


def serialize_project(project) -> ProjectResponse:
    """Serialize Project ORM object to ProjectResponse"""
    # Serialize owner if available
    owner_dict = None
    if project.owner:
        owner_response = UserResponse.model_validate(project.owner)
        owner_dict = owner_response.model_dump()
    
    # Serialize cliente if available (se houver relação)
    cliente_dict = None
    # TODO: Adicionar relação com cliente quando disponível
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        startDate=project.startDate,
        endDate=project.endDate,
        budget=project.budget,
        owner_id=project.owner_id,
        created_at=project.created_at,
        updated_at=project.updated_at,
        atividades=[],  # Será preenchido se necessário
        owner=owner_dict,
        cliente=cliente_dict
    )


@router.get("/", response_model=List[ProjectResponse])
@router.get("", response_model=List[ProjectResponse])  # Route without trailing slash
def read_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get projects accessible to the current user"""
    projects = ProjectService.get_user_accessible_projects(
        db, user_id=current_user.id, is_admin=current_user.is_admin
    )
    # Carregar relacionamentos e serializar
    project_ids = [p.id for p in projects]
    projects_with_relations = db.query(Project).options(
        joinedload(Project.owner)
    ).filter(Project.id.in_(project_ids)).all()
    
    return [serialize_project(p) for p in projects_with_relations][skip:skip+limit]


@router.get("/{project_id}", response_model=ProjectResponse)
def read_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get project by ID - accessible to all authenticated users"""
    project = db.query(Project).options(
        joinedload(Project.owner)
    ).filter(Project.id == project_id).first()
    
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # All authenticated users can access any project
    return serialize_project(project)


@router.post("/", response_model=ProjectResponse)
@router.post("", response_model=ProjectResponse)  # Route without trailing slash
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create new project"""
    created_project = ProjectService.create_project(
        db=db, project=project, owner_id=current_user.id
    )
    # Carregar relacionamentos e serializar
    project_with_relations = db.query(Project).options(
        joinedload(Project.owner)
    ).filter(Project.id == created_project.id).first()
    
    return serialize_project(project_with_relations)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: uuid.UUID,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update project - only owners and admins can modify"""
    # Check if project exists and user has permission
    project = ProjectService.get_project(db, project_id=project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    updated_project = ProjectService.update_project(
        db, project_id=project_id, project_update=project_update
    )
    return updated_project


@router.delete("/{project_id}")
def delete_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete project - only owners and admins can delete"""
    # Check if project exists and user has permission
    project = ProjectService.get_project(db, project_id=project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        success = ProjectService.delete_project(db, project_id=project_id)
        if not success:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"message": "Project deleted successfully"}
    except ValueError as e:
        # Erro de validação (ex: projeto tem usuários atribuídos)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Outros erros (ex: constraint violation)
        raise HTTPException(status_code=500, detail=str(e)) 