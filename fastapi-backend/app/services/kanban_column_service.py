from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from ..models.kanban_column import KanbanColumn
from ..schemas.kanban_column import KanbanColumnCreate, KanbanColumnUpdate


class KanbanColumnService:
    """Service for managing kanban columns"""
    
    @staticmethod
    def get_columns(db: Session) -> List[KanbanColumn]:
        """Get all columns ordered by order"""
        return db.query(KanbanColumn).order_by(KanbanColumn.order).all()
    
    @staticmethod
    def get_column(db: Session, column_id: UUID) -> Optional[KanbanColumn]:
        """Get column by ID"""
        return db.query(KanbanColumn).filter(KanbanColumn.id == column_id).first()
    
    @staticmethod
    def create_column(db: Session, column: KanbanColumnCreate) -> KanbanColumn:
        """Create new column"""
        # Get max order
        max_order = db.query(KanbanColumn).count()
        column_data = column.dict()
        column_data['order'] = max_order
        db_column = KanbanColumn(**column_data)
        db.add(db_column)
        db.commit()
        db.refresh(db_column)
        return db_column
    
    @staticmethod
    def update_column(db: Session, column_id: UUID, column_update: KanbanColumnUpdate) -> Optional[KanbanColumn]:
        """Update column"""
        db_column = db.query(KanbanColumn).filter(KanbanColumn.id == column_id).first()
        if db_column:
            update_data = column_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_column, field, value)
            db.commit()
            db.refresh(db_column)
        return db_column
    
    @staticmethod
    def delete_column(db: Session, column_id: UUID) -> bool:
        """Delete column"""
        db_column = db.query(KanbanColumn).filter(KanbanColumn.id == column_id).first()
        if db_column:
            db.delete(db_column)
            db.commit()
            return True
        return False
    
    @staticmethod
    def reorder_columns(db: Session, column_orders: List[dict]) -> List[KanbanColumn]:
        """Reorder columns"""
        for col_order in column_orders:
            db_column = db.query(KanbanColumn).filter(KanbanColumn.id == col_order['id']).first()
            if db_column:
                db_column.order = col_order['order']
        db.commit()
        return db.query(KanbanColumn).order_by(KanbanColumn.order).all()


