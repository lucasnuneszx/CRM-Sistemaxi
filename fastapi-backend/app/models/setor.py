from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from .base import BaseModel


class Setor(BaseModel):
    __tablename__ = "setores"

    nome = Column(String(255), nullable=False, unique=True)
    descricao = Column(String(500), nullable=True)
    
    # Relationships
    atividades = relationship("Atividade", back_populates="setor")
    users = relationship("User", back_populates="setor") 