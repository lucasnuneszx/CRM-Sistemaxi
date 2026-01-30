from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import UUID
from ..models.user_project import UserProject, ProjectRole
from ..models.user import User
from ..models.project import Project
from ..schemas.user_project import UserProjectCreate, UserProjectUpdate, UserProjectResponse


class UserProjectService:
    """Serviço para gerenciar atribuições de usuários a projetos"""
    
    @staticmethod
    def assign_user_to_project(
        db: Session, 
        user_id: UUID, 
        project_id: UUID, 
        role: ProjectRole = ProjectRole.CREATIVE_USER
    ) -> UserProject:
        """Atribuir usuário a um projeto com role específica"""
        # Verificar se usuário existe
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"Usuário com ID {user_id} não encontrado")
        
        # Verificar se projeto existe
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Projeto com ID {project_id} não encontrado")
        
        # Verificar se já existe
        existing = db.query(UserProject).filter(
            UserProject.user_id == user_id,
            UserProject.project_id == project_id
        ).first()
        
        if existing:
            # Atualizar role se já existir
            existing.role = role
            db.commit()
            db.refresh(existing)
            
            # Carregar relacionamentos
            existing = db.query(UserProject).options(
                joinedload(UserProject.user),
                joinedload(UserProject.project)
            ).filter(UserProject.id == existing.id).first()
            
            return existing
        
        # Criar nova atribuição
        user_project = UserProject(
            user_id=user_id,
            project_id=project_id,
            role=role
        )
        
        db.add(user_project)
        db.commit()
        db.refresh(user_project)
        
        # Carregar relacionamentos para garantir que estejam disponíveis
        user_project = db.query(UserProject).options(
            joinedload(UserProject.user),
            joinedload(UserProject.project)
        ).filter(UserProject.id == user_project.id).first()
        
        return user_project
    
    @staticmethod
    def remove_user_from_project(db: Session, user_id: UUID, project_id: UUID) -> bool:
        """Remover usuário de um projeto"""
        user_project = db.query(UserProject).filter(
            UserProject.user_id == user_id,
            UserProject.project_id == project_id
        ).first()
        
        if user_project:
            db.delete(user_project)
            db.commit()
            return True
        
        return False
    
    @staticmethod
    def get_user_projects(db: Session, user_id: UUID) -> List[UserProject]:
        """Buscar todos os projetos de um usuário"""
        return db.query(UserProject).options(
            joinedload(UserProject.project)
        ).filter(UserProject.user_id == user_id).all()
    
    @staticmethod
    def get_project_users(db: Session, project_id: UUID) -> List[UserProject]:
        """Buscar todos os usuários de um projeto"""
        return db.query(UserProject).options(
            joinedload(UserProject.user)
        ).filter(UserProject.project_id == project_id).all()
    
    @staticmethod
    def get_user_project_role(db: Session, user_id: UUID, project_id: UUID) -> Optional[ProjectRole]:
        """Buscar role de um usuário em um projeto específico"""
        user_project = db.query(UserProject).filter(
            UserProject.user_id == user_id,
            UserProject.project_id == project_id
        ).first()
        
        return user_project.role if user_project else None
    
    @staticmethod
    def user_has_access_to_project(db: Session, user_id: UUID, project_id: UUID) -> bool:
        """Verificar se usuário tem acesso a um projeto (qualquer role)"""
        # Admin sempre tem acesso
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.is_admin:
            return True
        
        # Owner do projeto tem acesso
        project = db.query(Project).filter(Project.id == project_id).first()
        if project and project.owner_id == user_id:
            return True
        
        # Verificar atribuição específica
        user_project = db.query(UserProject).filter(
            UserProject.user_id == user_id,
            UserProject.project_id == project_id
        ).first()
        
        return user_project is not None
    
    @staticmethod
    def user_can_manage_project(db: Session, user_id: UUID, project_id: UUID) -> bool:
        """Verificar se usuário pode gerenciar um projeto (admin, owner ou project_manager)"""
        # Admin sempre pode gerenciar
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.is_admin:
            return True
        
        # Owner do projeto pode gerenciar
        project = db.query(Project).filter(Project.id == project_id).first()
        if project and project.owner_id == user_id:
            return True
        
        # Project Manager pode gerenciar
        user_project = db.query(UserProject).filter(
            UserProject.user_id == user_id,
            UserProject.project_id == project_id,
            UserProject.role == ProjectRole.PROJECT_MANAGER
        ).first()
        
        return user_project is not None 