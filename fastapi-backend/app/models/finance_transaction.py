from sqlalchemy import Column, String, Numeric, Date, DateTime, Enum as SQLEnum, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
import uuid
from datetime import datetime
from .base import BaseModel


class TransactionType(enum.Enum):
    PAYABLE = "payable"
    RECEIVABLE = "receivable"


class TransactionStatus(enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"


class FinanceTransaction(BaseModel):
    __tablename__ = "finance_transactions"

    type = Column(SQLEnum(TransactionType), nullable=False, index=True)
    description = Column(String(500), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    paid_date = Column(Date, nullable=True)
    entity_name = Column(String(255), nullable=False)  # Cliente ou Fornecedor
    category = Column(String(100), nullable=False)
    status = Column(SQLEnum(TransactionStatus), nullable=False, default=TransactionStatus.PENDING, index=True)
    notes = Column(Text, nullable=True)
    criado_por_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationship
    criado_por = relationship("User", foreign_keys=[criado_por_id])

