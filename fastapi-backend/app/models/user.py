from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel
import uuid


class User(BaseModel):
    __tablename__ = "users"
    
    name = Column(String, nullable=False)  # Nome completo
    username = Column(String, unique=True, index=True, nullable=False)  # Login/username
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    setor_id = Column(UUID(as_uuid=True), ForeignKey("setores.id"), nullable=True)
    foto_perfil = Column(String, nullable=True)  # URL da foto de perfil
    telefone = Column(String, nullable=True)  # Telefone do usuário
    bio = Column(String, nullable=True)  # Biografia do usuário
    
    # Relationships
    projects = relationship("Project", back_populates="owner")
    atividades = relationship("Atividade", back_populates="responsavel")
    setor = relationship("Setor", back_populates="users")
    user_projects = relationship("UserProject", back_populates="user", cascade="all, delete-orphan") 