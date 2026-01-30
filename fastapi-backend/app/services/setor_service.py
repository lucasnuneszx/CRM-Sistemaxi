from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from ..models.setor import Setor
from ..schemas.setor import SetorCreate, SetorUpdate


class SetorService:
    """Service for managing setores"""
    
    @staticmethod
    def get_setores(db: Session, skip: int = 0, limit: int = 100) -> List[Setor]:
        """Get all setores"""
        return db.query(Setor).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_setor(db: Session, setor_id: uuid.UUID) -> Optional[Setor]:
        """Get setor by ID"""
        return db.query(Setor).filter(Setor.id == setor_id).first()
    
    @staticmethod
    def create_setor(db: Session, setor: SetorCreate) -> Setor:
        """Create new setor"""
        db_setor = Setor(**setor.model_dump())
        db.add(db_setor)
        db.commit()
        db.refresh(db_setor)
        return db_setor
    
    @staticmethod
    def update_setor(db: Session, setor_id: uuid.UUID, setor_update: SetorUpdate) -> Optional[Setor]:
        """Update setor"""
        db_setor = db.query(Setor).filter(Setor.id == setor_id).first()
        if db_setor:
            update_data = setor_update.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_setor, field, value)
            db.commit()
            db.refresh(db_setor)
        return db_setor
    
    @staticmethod
    def delete_setor(db: Session, setor_id: uuid.UUID) -> bool:
        """Delete setor"""
        db_setor = db.query(Setor).filter(Setor.id == setor_id).first()
        if db_setor:
            db.delete(db_setor)
            db.commit()
            return True
        return False 