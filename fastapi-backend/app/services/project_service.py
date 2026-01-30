from sqlalchemy.orm import Session
from typing import List, Optional, Union
import uuid
import logging
from ..models.project import Project
from ..models.user_project import UserProject
from ..schemas.project import ProjectCreate, ProjectUpdate

logger = logging.getLogger(__name__)


class ProjectService:
    """Project service for CRUD operations"""
    
    @staticmethod
    def get_project(db: Session, project_id: Union[str, uuid.UUID]) -> Optional[Project]:
        """Get project by ID"""
        return db.query(Project).filter(Project.id == project_id).first()
    
    @staticmethod
    def get_projects(db: Session, user_id: Optional[Union[str, uuid.UUID]] = None, skip: int = 0, limit: int = 100) -> List[Project]:
        """Get list of projects, optionally filtered by user"""
        query = db.query(Project)
        if user_id:
            query = query.filter(Project.owner_id == user_id)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_user_accessible_projects(db: Session, user_id: Union[str, uuid.UUID], is_admin: bool = False) -> List[Project]:
        """Get projects that user has access to (owned + assigned)"""
        if is_admin:
            # Admin can see all projects
            return db.query(Project).all()
        
        # Get projects user owns
        owned_projects = db.query(Project).filter(Project.owner_id == user_id).all()
        
        # Get projects user is assigned to
        assigned_project_ids = db.query(UserProject.project_id).filter(
            UserProject.user_id == user_id
        ).subquery()
        
        assigned_projects = db.query(Project).filter(
            Project.id.in_(assigned_project_ids)
        ).all()
        
        # Combine and deduplicate
        all_projects = {}
        for project in owned_projects + assigned_projects:
            all_projects[project.id] = project
        
        return list(all_projects.values())
    
    @staticmethod
    def create_project(db: Session, project: ProjectCreate, owner_id: Union[str, uuid.UUID]) -> Project:
        """Create new project"""
        db_project = Project(
            name=project.name,
            description=project.description,
            status=project.status,
            startDate=project.startDate,
            endDate=project.endDate,
            budget=project.budget,
            owner_id=owner_id
        )
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        return db_project
    
    @staticmethod
    def update_project(db: Session, project_id: Union[str, uuid.UUID], project_update: ProjectUpdate) -> Optional[Project]:
        """Update project"""
        db_project = db.query(Project).filter(Project.id == project_id).first()
        if not db_project:
            return None
        
        update_data = project_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_project, field, value)
        
        db.commit()
        db.refresh(db_project)
        return db_project
    
    @staticmethod
    def delete_project(db: Session, project_id: Union[str, uuid.UUID]) -> bool:
        """Delete project"""
        # Converter string para UUID se necessário
        if isinstance(project_id, str):
            try:
                project_id = uuid.UUID(project_id)
            except ValueError:
                return False
        
        try:
            db_project = db.query(Project).filter(Project.id == project_id).first()
            if not db_project:
                return False
            
            # Limpar tabelas relacionadas que podem não ter cascade configurado
            try:
                from sqlalchemy import text
                
                # 1. Limpar funnel_cards que referenciam credenciais_acesso do projeto
                # Primeiro verificar se a tabela existe
                funnel_cards_exists = db.execute(
                    text("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_schema = 'public' AND table_name = 'funnel_cards'
                        )
                    """)
                ).scalar()
                
                if funnel_cards_exists:
                    # Buscar credenciais do projeto
                    credenciais_ids = db.execute(
                        text("SELECT id FROM credenciais_acesso WHERE projeto_id = :project_id"),
                        {"project_id": str(db_project.id)}
                    ).fetchall()
                    
                    # Para cada credencial, limpar funnel_cards que a referenciam
                    for credencial_row in credenciais_ids:
                        credencial_id = str(credencial_row[0])
                        db.execute(
                            text("DELETE FROM funnel_cards WHERE credencial_id = :credencial_id"),
                            {"credencial_id": credencial_id}
                        )
                
                # 2. Limpar funnel_stages se existir
                funnel_stages_exists = db.execute(
                    text("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_schema = 'public' AND table_name = 'funnel_stages'
                        )
                    """)
                ).scalar()
                
                if funnel_stages_exists:
                    funnel_stages_count = db.execute(
                        text("SELECT COUNT(*) FROM funnel_stages WHERE projeto_id = :project_id"),
                        {"project_id": str(db_project.id)}
                    ).scalar()
                    if funnel_stages_count > 0:
                        # Deletar funnel_stages manualmente
                        db.execute(
                            text("DELETE FROM funnel_stages WHERE projeto_id = :project_id"),
                            {"project_id": str(db_project.id)}
                        )
                
                # Flush para aplicar as mudanças antes do commit
                db.flush()
            except Exception as e:
                # Se houver erro, fazer rollback e continuar
                db.rollback()
                # Re-query o projeto após rollback
                db_project = db.query(Project).filter(Project.id == project_id).first()
                if not db_project:
                    return False
                # Log do erro mas continua (pode ser que as tabelas não existam)
                logger.warning(f"Aviso ao limpar tabelas relacionadas: {e}")
            
            # As atividades e outros relacionamentos serão excluídos em cascata devido ao cascade="delete"
            db.delete(db_project)
            db.commit()
            return True
        except ValueError:
            # Re-raise ValueError para que o endpoint possa retornar mensagem apropriada
            if db.in_transaction():
                db.rollback()
            raise
        except Exception as e:
            if db.in_transaction():
                db.rollback()
            raise Exception(f"Erro ao excluir projeto: {str(e)}") 