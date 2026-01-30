from sqlalchemy import Column, String, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class KanbanColumn(BaseModel):
    __tablename__ = "kanban_columns"
    
    title = Column(String(255), nullable=False)
    order = Column(Integer, nullable=False, default=0)
    color = Column(String(50), nullable=True)  # Cor da coluna (hex)
    
    # Relationships
    leads = relationship("Lead", back_populates="column", cascade="all, delete-orphan")

