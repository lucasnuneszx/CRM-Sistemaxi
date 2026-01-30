from pydantic import BaseModel, HttpUrl
from typing import Optional, Any
from datetime import datetime
import uuid

# Base Pydantic model for Documento
class DocumentoBase(BaseModel):
    nome: str
    tamanho: Optional[int] = None
    tipo: Optional[str] = None
    pasta: Optional[str] = "general"
    # projeto_id: Optional[uuid.UUID] = None # Uncomment if linking to projects
    # atividade_id: Optional[uuid.UUID] = None # Uncomment if linking to atividades

# Schema for creating a Documento (input)
# The actual file upload will be handled separately by FastAPI's UploadFile
# This schema is for the metadata we store in the DB.
class DocumentoCreate(DocumentoBase):
    key: str # MinIO object key, set by the service after upload

# Schema for updating a Documento (input)
class DocumentoUpdate(BaseModel):
    nome: Optional[str] = None
    pasta: Optional[str] = None
    # Potentially other fields if they are mutable

# Schema for Documento response (output)
class DocumentoResponse(DocumentoBase):
    id: uuid.UUID
    key: str # MinIO object key
    url: Optional[HttpUrl] = None # Presigned URL, will be populated by the service/endpoint
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Replace orm_mode for Pydantic v2

# Schema for download URL response
class DownloadURL(BaseModel):
    url: HttpUrl 