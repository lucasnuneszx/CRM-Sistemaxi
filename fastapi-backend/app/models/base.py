from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from ..core.database import Base


class BaseModel(Base):
    """Base model class with common fields"""
    __abstract__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 