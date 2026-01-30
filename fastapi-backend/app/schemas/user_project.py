from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from ..models.user_project import ProjectRole


class UserProjectBase(BaseModel):
    user_id: UUID
    project_id: UUID
    role: ProjectRole


class UserProjectCreate(UserProjectBase):
    pass


class UserProjectUpdate(BaseModel):
    role: Optional[ProjectRole] = None


class UserProjectResponse(UserProjectBase):
    id: UUID
    
    # Nested data
    user: Optional[dict] = None
    project: Optional[dict] = None
    
    class Config:
        from_attributes = True


class UserProjectAssignment(BaseModel):
    """Para atribuir usuários a projetos"""
    user_id: UUID
    role: ProjectRole = ProjectRole.CREATIVE_USER 