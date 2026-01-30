from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Union
import uuid
from ..models.user import User
from ..schemas.user import UserCreate, UserUpdate
from ..core.security import get_password_hash


class UserService:
    """User service for CRUD operations"""
    
    @staticmethod
    def get_user(db: Session, user_id: Union[str, uuid.UUID]) -> Optional[User]:
        """Get user by ID with setor loaded"""
        # Converter string para UUID se necessário
        if isinstance(user_id, str):
            try:
                user_id = uuid.UUID(user_id)
            except (ValueError, AttributeError):
                return None
        return db.query(User).options(joinedload(User.setor)).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Get user by username"""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Get list of users with setor loaded"""
        return db.query(User).options(joinedload(User.setor)).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        """Create new user"""
        hashed_password = get_password_hash(user.password)
        db_user = User(
            name=user.name,
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            is_active=user.is_active,
            is_admin=user.is_admin,
            setor_id=user.setor_id
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        # Load setor relationship
        db.refresh(db_user)
        return db.query(User).options(joinedload(User.setor)).filter(User.id == db_user.id).first()
    
    @staticmethod
    def update_user(db: Session, user_id: Union[str, uuid.UUID], user_update: UserUpdate) -> Optional[User]:
        """Update user"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return None
        
        update_data = user_update.model_dump(exclude_unset=True)
        
        # Handle password update
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        db.commit()
        db.refresh(db_user)
        # Return with setor loaded
        return db.query(User).options(joinedload(User.setor)).filter(User.id == user_id).first()
    
    @staticmethod
    def delete_user(db: Session, user_id: Union[str, uuid.UUID]) -> bool:
        """Delete user"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return False
        
        try:
            # Verificar se o usuário é owner de projetos
            from ..models.project import Project
            owned_projects = db.query(Project).filter(Project.owner_id == db_user.id).count()
            if owned_projects > 0:
                # Não permitir exclusão se o usuário é owner de projetos
                # Alternativa: transferir ownership ou marcar como inativo
                raise ValueError(f"Não é possível excluir usuário que é responsável por {owned_projects} projeto(s). Considere desativar o usuário ao invés de excluí-lo.")
            
            # Verificar se o usuário tem atividades atribuídas
            from ..models.atividade import Atividade
            atividades_count = db.query(Atividade).filter(Atividade.responsavel_id == db_user.id).count()
            if atividades_count > 0:
                # Remover responsabilidade das atividades antes de excluir
                db.query(Atividade).filter(Atividade.responsavel_id == db_user.id).update({"responsavel_id": None})
            
            # Buscar um usuário admin padrão para transferir leads e criativos
            # Primeiro tenta encontrar um admin diferente do usuário sendo excluído
            admin_user = db.query(User).filter(
                User.is_admin == True,
                User.id != db_user.id,
                User.is_active == True
            ).first()
            
            # Se não encontrar admin, busca qualquer usuário ativo diferente
            if not admin_user:
                admin_user = db.query(User).filter(
                    User.id != db_user.id,
                    User.is_active == True
                ).first()
            
            # Se ainda não encontrar, não pode excluir
            if not admin_user:
                raise ValueError("Não é possível excluir o usuário. É necessário ter pelo menos um outro usuário ativo no sistema.")
            
            # Transferir leads criados pelo usuário
            from ..models.lead import Lead
            leads_count = db.query(Lead).filter(Lead.criado_por_id == db_user.id).count()
            if leads_count > 0:
                db.query(Lead).filter(Lead.criado_por_id == db_user.id).update(
                    {"criado_por_id": admin_user.id}
                )
            
            # Transferir criativos criados pelo usuário
            from ..models.criativo import Criativo
            criativos_criados_count = db.query(Criativo).filter(Criativo.criado_por_id == db_user.id).count()
            if criativos_criados_count > 0:
                db.query(Criativo).filter(Criativo.criado_por_id == db_user.id).update(
                    {"criado_por_id": admin_user.id}
                )
            
            # Remover referência de criativos editados pelo usuário (pode ser NULL)
            criativos_editados_count = db.query(Criativo).filter(Criativo.editor_id == db_user.id).count()
            if criativos_editados_count > 0:
                db.query(Criativo).filter(Criativo.editor_id == db_user.id).update(
                    {"editor_id": None}
                )
            
            # Remover referência de transações financeiras criadas pelo usuário (pode ser NULL)
            from ..models.finance_transaction import FinanceTransaction
            transacoes_count = db.query(FinanceTransaction).filter(
                FinanceTransaction.criado_por_id == db_user.id
            ).count()
            if transacoes_count > 0:
                db.query(FinanceTransaction).filter(
                    FinanceTransaction.criado_por_id == db_user.id
                ).update({"criado_por_id": None})
            
            db.delete(db_user)
            db.commit()
            return True
        except ValueError:
            # Re-raise ValueError para que o endpoint possa retornar mensagem apropriada
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise Exception(f"Erro ao excluir usuário: {str(e)}") 