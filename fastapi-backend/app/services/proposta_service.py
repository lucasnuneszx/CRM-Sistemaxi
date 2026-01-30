from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from ..models.proposta import Proposta
from ..schemas.proposta import PropostaCreate, PropostaUpdate


class PropostaService:
    """Service for managing propostas"""
    
    @staticmethod
    def get_propostas(db: Session, skip: int = 0, limit: int = 100, cliente_id: Optional[UUID] = None) -> List[Proposta]:
        """Get all propostas"""
        query = db.query(Proposta)
        if cliente_id:
            query = query.filter(Proposta.cliente_id == cliente_id)
        return query.order_by(Proposta.ordem, Proposta.prioridade).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_proposta(db: Session, proposta_id: UUID) -> Optional[Proposta]:
        """Get proposta by ID"""
        return db.query(Proposta).filter(Proposta.id == proposta_id).first()
    
    @staticmethod
    def create_proposta(db: Session, proposta: PropostaCreate) -> Proposta:
        """Create new proposta"""
        proposta_data = proposta.model_dump() if hasattr(proposta, 'model_dump') else proposta.dict()
        if not proposta_data.get('data_criacao'):
            proposta_data['data_criacao'] = datetime.utcnow()
        # Get max order
        max_order = db.query(Proposta).count()
        proposta_data['ordem'] = max_order
        db_proposta = Proposta(**proposta_data)
        db.add(db_proposta)
        db.commit()
        db.refresh(db_proposta)
        return db_proposta
    
    @staticmethod
    def update_proposta(db: Session, proposta_id: UUID, proposta_update: PropostaUpdate) -> Optional[Proposta]:
        """Update proposta"""
        db_proposta = db.query(Proposta).filter(Proposta.id == proposta_id).first()
        if db_proposta:
            update_data = proposta_update.model_dump(exclude_unset=True) if hasattr(proposta_update, 'model_dump') else proposta_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_proposta, field, value)
            db.commit()
            db.refresh(db_proposta)
        return db_proposta
    
    @staticmethod
    def delete_proposta(db: Session, proposta_id: UUID) -> bool:
        """Delete proposta"""
        db_proposta = db.query(Proposta).filter(Proposta.id == proposta_id).first()
        if db_proposta:
            db.delete(db_proposta)
            db.commit()
            return True
        return False
    
    @staticmethod
    def reorder_propostas(db: Session, proposta_orders: List[dict]) -> List[Proposta]:
        """Reorder propostas"""
        for prop_order in proposta_orders:
            db_proposta = db.query(Proposta).filter(Proposta.id == prop_order['id']).first()
            if db_proposta:
                db_proposta.ordem = prop_order['ordem']
                db_proposta.prioridade = prop_order.get('prioridade', prop_order['ordem'])
        db.commit()
        return db.query(Proposta).order_by(Proposta.ordem, Proposta.prioridade).all()

