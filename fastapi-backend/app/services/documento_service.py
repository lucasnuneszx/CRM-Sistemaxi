from sqlalchemy.orm import Session
from typing import List, Optional, Union
import uuid

from ..models.documento import Documento
from ..schemas.documento import DocumentoCreate, DocumentoUpdate
from .minio_service import minio_service  # For pre-signed URLs

class DocumentoService:

    @staticmethod
    def get_documento(db: Session, documento_id: uuid.UUID) -> Optional[Documento]:
        return db.query(Documento).filter(Documento.id == documento_id).first()

    @staticmethod
    def get_documentos_by_pasta(
        db: Session, 
        pasta: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Documento]:
        return db.query(Documento).filter(Documento.pasta == pasta).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_all_documentos(db: Session, skip: int = 0, limit: int = 100) -> List[Documento]:
        return db.query(Documento).offset(skip).limit(limit).all()

    @staticmethod
    def create_documento(db: Session, documento: DocumentoCreate) -> Documento:
        db_documento = Documento(
            nome=documento.nome,
            key=documento.key,
            tamanho=documento.tamanho,
            tipo=documento.tipo,
            pasta=documento.pasta
            # projeto_id=documento.projeto_id, # Add if using project linkage
            # atividade_id=documento.atividade_id # Add if using atividade linkage
        )
        db.add(db_documento)
        db.commit()
        db.refresh(db_documento)
        return db_documento

    @staticmethod
    def update_documento(
        db: Session, 
        documento_id: uuid.UUID, 
        documento_update: DocumentoUpdate
    ) -> Optional[Documento]:
        db_documento = DocumentoService.get_documento(db, documento_id)
        if not db_documento:
            return None
        
        update_data = documento_update.model_dump(exclude_unset=True) # Pydantic v2
        for field, value in update_data.items():
            setattr(db_documento, field, value)
        
        db.commit()
        db.refresh(db_documento)
        return db_documento

    @staticmethod
    def delete_documento(db: Session, documento_id: uuid.UUID) -> Optional[Documento]:
        db_documento = DocumentoService.get_documento(db, documento_id)
        if not db_documento:
            return None
        
        # Important: Also delete from MinIO using minio_service.delete_file(db_documento.key)
        # This should be handled in the API endpoint layer to ensure atomicity or compensation.
        
        db.delete(db_documento)
        db.commit()
        return db_documento 