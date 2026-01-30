from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from ....schemas import documento as schemas
from ....core.database import get_db
from ....services.minio_service import minio_service
from ....services.documento_service import DocumentoService
from ....api.deps import get_current_active_user  # For authentication
from ....models.user import User

router = APIRouter()

# IMPORTANTE: GET deve vir ANTES de POST para evitar conflitos de roteamento
@router.get("/", response_model=List[schemas.DocumentoResponse])
@router.get("", response_model=List[schemas.DocumentoResponse])  # Suporte para rota sem trailing slash
def list_documentos(
    db: Session = Depends(get_db),
    pasta: Optional[str] = Query(None, description="Filtrar por pasta"),  # Query parameter explícito
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve documents. Can be filtered by 'pasta'.
    The frontend filters by key.startsWith(folder), so this should align.
    """
    if pasta:
        db_documentos = DocumentoService.get_documentos_by_pasta(db, pasta=pasta, skip=skip, limit=limit)
    else:
        db_documentos = DocumentoService.get_all_documentos(db, skip=skip, limit=limit)
    
    response_docs = []
    for db_doc in db_documentos:
        doc_response = schemas.DocumentoResponse.model_validate(db_doc)
        try:
            doc_response.url = minio_service.get_download_url(db_doc.key)
        except Exception as e:
            print(f"Error generating download URL for {db_doc.key}: {e}") # Replace with proper logging
            doc_response.url = None # Or some placeholder indicating an error
        response_docs.append(doc_response)
    return response_docs

@router.post("/", response_model=schemas.DocumentoResponse)
@router.post("", response_model=schemas.DocumentoResponse)  # Suporte para rota sem trailing slash
def create_documento_entry(
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    pasta: Optional[str] = Form("general"), # Folder comes from form data
    # projeto_id: Optional[uuid.UUID] = Form(None), # Optional: Link to project
    # atividade_id: Optional[uuid.UUID] = Form(None), # Optional: Link to atividade
    current_user: User = Depends(get_current_active_user)  # Authentication
):
    """
    Uploads a file to MinIO and creates a document metadata entry in the database.
    The frontend's FileUpload component should send 'file' and optionally 'pasta'.
    """
    try:
        minio_object_key = minio_service.upload_file(file=file, folder=pasta)
    except HTTPException as e:
        # Re-raise MinIO service exceptions if they are already HTTPExceptions
        raise e
    except Exception as e:
        # Catch any other unexpected errors during MinIO upload
        raise HTTPException(status_code=500, detail=f"MinIO upload failed: {str(e)}")

    documento_in = schemas.DocumentoCreate(
        nome=file.filename,
        key=minio_object_key,
        tamanho=file.size,
        tipo=file.content_type,
        pasta=pasta,
        # projeto_id=projeto_id,
        # atividade_id=atividade_id
    )
    db_documento = DocumentoService.create_documento(db=db, documento=documento_in)
    
    # Populate the presigned URL for the response
    try:
        download_url = minio_service.get_download_url(db_documento.key)
        response_doc = schemas.DocumentoResponse.model_validate(db_documento) # Pydantic V2
        response_doc.url = download_url
        return response_doc
    except Exception as e:
        # If URL generation fails, still return the doc info but log the error
        # Or, you could raise an error if the URL is critical for the response
        print(f"Error generating download URL for {db_documento.key}: {e}") # Replace with proper logging
        return schemas.DocumentoResponse.model_validate(db_documento)

@router.get("/{documento_id}", response_model=schemas.DocumentoResponse)
def get_documento_details(
    documento_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_documento = DocumentoService.get_documento(db, documento_id=documento_id)
    if not db_documento:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    doc_response = schemas.DocumentoResponse.model_validate(db_documento)
    try:
        doc_response.url = minio_service.get_download_url(db_documento.key)
    except Exception as e:
        print(f"Error generating download URL for {db_documento.key}: {e}")
        doc_response.url = None
    return doc_response

@router.get("/{documento_id}/download", response_model=schemas.DownloadURL)
async def get_documento_download_url(
    documento_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generates a presigned URL for downloading a document."""
    db_documento = DocumentoService.get_documento(db, documento_id=documento_id)
    if not db_documento:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    try:
        download_url = minio_service.get_download_url(object_name=db_documento.key)
        return schemas.DownloadURL(url=download_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not generate download URL: {str(e)}")

@router.delete("/{documento_id}", response_model=schemas.DocumentoResponse)
def delete_documento_entry(
    documento_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_documento = DocumentoService.get_documento(db, documento_id=documento_id)
    if not db_documento:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    # Attempt to delete from MinIO first or handle potential inconsistencies
    try:
        minio_service.delete_file(object_name=db_documento.key)
    except Exception as e:
        # Log the error and decide if you want to proceed with DB deletion or not
        # For now, we raise an error to prevent DB deletion if MinIO fails
        print(f"Error deleting '{db_documento.key}' from MinIO: {e}")
        raise HTTPException(status_code=500, detail=f"MinIO deletion failed for key {db_documento.key}: {str(e)}")

    deleted_db_documento = DocumentoService.delete_documento(db, documento_id=documento_id)
    if not deleted_db_documento: # Should not happen if found before, but good check
        raise HTTPException(status_code=404, detail="Documento não encontrado no DB após tentativa de deleção")
    
    # No URL needed for delete response
    return schemas.DocumentoResponse.model_validate(deleted_db_documento)

# Need to add a DownloadURL schema for the /download endpoint
# I'll add this to fastapi-backend/app/schemas/documento.py 