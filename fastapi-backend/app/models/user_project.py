from sqlalchemy import Column, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class ProjectRole(str, enum.Enum):
    """Roles específicas para projetos"""
    PROJECT_MANAGER = "project_manager"  # Acesso total ao projeto
    CREATIVE_USER = "creative_user"      # Acesso apenas aos criativos


class UserProject(BaseModel):
    """Relacionamento entre usuário e projeto com role específica"""
    __tablename__ = "user_projects"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    role = Column(SQLEnum(ProjectRole), nullable=False, default=ProjectRole.CREATIVE_USER)
    
    # Relationships
    user = relationship("User", back_populates="user_projects")
    project = relationship("Project", back_populates="user_projects")
    
    # Constraint para evitar duplicatas
    __table_args__ = (
        {"schema": None},
    ) 