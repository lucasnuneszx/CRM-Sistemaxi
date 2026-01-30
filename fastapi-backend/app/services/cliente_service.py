from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from ..models.cliente import Cliente
from ..schemas.cliente import ClienteCreate, ClienteUpdate


class ClienteService:
    """Service for managing clientes"""
    
    @staticmethod
    def get_clientes(db: Session, skip: int = 0, limit: int = 100) -> List[Cliente]:
        """Get all clientes"""
        return db.query(Cliente).order_by(Cliente.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_cliente(db: Session, cliente_id: UUID) -> Optional[Cliente]:
        """Get cliente by ID"""
        return db.query(Cliente).filter(Cliente.id == cliente_id).first()
    
    @staticmethod
    def get_cliente_by_cpf(db: Session, cpf: str) -> Optional[Cliente]:
        """Get cliente by CPF"""
        return db.query(Cliente).filter(Cliente.cpf == cpf).first()
    
    @staticmethod
    def get_cliente_by_email(db: Session, email: str) -> Optional[Cliente]:
        """Get cliente by email"""
        return db.query(Cliente).filter(Cliente.email == email).first()
    
    @staticmethod
    def create_cliente(db: Session, cliente: ClienteCreate) -> Cliente:
        """Create new cliente"""
        try:
            cliente_data = cliente.model_dump() if hasattr(cliente, 'model_dump') else cliente.dict()
            print(f"📝 Criando cliente com dados: {cliente_data}")
            db_cliente = Cliente(**cliente_data)
            db.add(db_cliente)
            db.commit()
            db.refresh(db_cliente)
            print(f"✅ Cliente criado com sucesso: {db_cliente.id}")
            return db_cliente
        except Exception as e:
            print(f"❌ Erro ao criar cliente: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def update_cliente(db: Session, cliente_id: UUID, cliente_update: ClienteUpdate) -> Optional[Cliente]:
        """Update cliente"""
        db_cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if db_cliente:
            update_data = cliente_update.model_dump(exclude_unset=True) if hasattr(cliente_update, 'model_dump') else cliente_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_cliente, field, value)
            db.commit()
            db.refresh(db_cliente)
        return db_cliente
    
    @staticmethod
    def delete_cliente(db: Session, cliente_id: UUID) -> bool:
        """Delete cliente"""
        db_cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if db_cliente:
            db.delete(db_cliente)
            db.commit()
            return True
        return False

