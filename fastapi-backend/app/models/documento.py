from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID # Assuming you might use UUIDs as in other models
from sqlalchemy.orm import relationship
import uuid # For default UUID generation

from .base import BaseModel # Assuming you have a BaseModel with id, created_at, updated_at

class Documento(BaseModel):
    __tablename__ = "documentos"

    nome = Column(String(255), nullable=False)
    key = Column(String(1024), nullable=False, unique=True)  # MinIO object key (path in bucket)
    # url: Not storing the direct presigned URL as it expires. It will be generated on demand.
    tamanho = Column(Integer, nullable=True)  # File size in bytes
    tipo = Column(String(100), nullable=True)  # MIME type
    pasta = Column(String(100), nullable=True, default="general") # Folder like 'general', 'images', 'documents'

    # Optional Foreign Keys (if you want to link documents to projects/atividades)
    # Ensure these related models (Project, Atividade) exist and are imported if you uncomment
    # projeto_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    # atividade_id = Column(UUID(as_uuid=True), ForeignKey("atividades.id"), nullable=True)

    # Relationships (if foreign keys are uncommented)
    # projeto = relationship("Project", back_populates="documentos")
    # atividade = relationship("Atividade", back_populates="documentos")

    def __repr__(self):
        return f"<Documento(id='{self.id}', nome='{self.nome}', key='{self.key}')>" 