from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from ..models.atividade import Atividade
from ..schemas.atividade import AtividadeCreate, AtividadeUpdate


class AtividadeService:
    """Service for managing atividades"""
    
    @staticmethod
    def get_atividades(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[UUID] = None) -> List[Atividade]:
        """Get all atividades"""
        query = db.query(Atividade)
        if user_id:
            # Filter by user's projects or assigned atividades
            query = query.filter(
                (Atividade.responsavel_id == user_id) |
                (Atividade.projeto.has(owner_id=user_id))
            )
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_atividade(db: Session, atividade_id: UUID) -> Optional[Atividade]:
        """Get atividade by ID"""
        return db.query(Atividade).filter(Atividade.id == atividade_id).first()
    
    @staticmethod
    def create_atividade(db: Session, atividade: AtividadeCreate) -> Atividade:
        """Create new atividade"""
        db_atividade = Atividade(**atividade.dict())
        db.add(db_atividade)
        db.commit()
        db.refresh(db_atividade)
        return db_atividade
    
    @staticmethod
    def update_atividade(db: Session, atividade_id: UUID, atividade_update: AtividadeUpdate) -> Optional[Atividade]:
        """Update atividade"""
        db_atividade = db.query(Atividade).filter(Atividade.id == atividade_id).first()
        if db_atividade:
            update_data = atividade_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_atividade, field, value)
            db.commit()
            db.refresh(db_atividade)
        return db_atividade
    
    @staticmethod
    def delete_atividade(db: Session, atividade_id: UUID) -> bool:
        """Delete atividade"""
        db_atividade = db.query(Atividade).filter(Atividade.id == atividade_id).first()
        if db_atividade:
            db.delete(db_atividade)
            db.commit()
            return True
        return False 