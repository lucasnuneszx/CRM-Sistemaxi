from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import logging

from ....core.database import get_db
from ....api.deps import get_current_user
from ....models.user import User
from ....models.criativo import StatusCriativo
from ....schemas.criativo import (
    CriativoCreate, CriativoUpdate, CriativoResponse,
    CriativosKanbanResponse, CriativosStats, StatusCriativo as StatusCriativoSchema
)
from ....services.criativo_service import CriativoService
from ....services.minio_service import minio_service

router = APIRouter()
logger = logging.getLogger(__name__)


def get_file_type_from_mime(mime_type: str) -> str:
    """Mapear MIME type para enum do PostgreSQL"""
    if mime_type.startswith('image/'): 
        return 'IMAGEM'
    if mime_type.startswith('video/'): 
        return 'VIDEO'
    if mime_type.startswith('audio/'): 
        return 'AUDIO'
    if 'pdf' in mime_type: 
        return 'DOCUMENTO'
    if 'document' in mime_type or 'doc' in mime_type: 
        return 'DOCUMENTO'
    if 'spreadsheet' in mime_type or 'excel' in mime_type: 
        return 'DOCUMENTO'
    return 'DOCUMENTO'


@router.post("/simple", response_model=CriativoResponse)
async def create_criativo_simple(
    criativo: CriativoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar um novo criativo via JSON (sem arquivo)"""
    try:
        criativo_service = CriativoService(db)
        return criativo_service.create_criativo(
            criativo, 
            current_user.id, 
            user_is_admin=current_user.is_admin
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar criativo: {str(e)}"
        )


@router.post("/", response_model=CriativoResponse)
async def create_criativo(
    titulo: str = Form(...),
    descricao: Optional[str] = Form(None),
    tipo_arquivo: str = Form("DOCUMENTO"),
    prioridade: str = Form("media"),
    prazo: Optional[str] = Form(None),
    observacoes: Optional[str] = Form(None),
    projeto_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar um novo criativo com upload opcional de arquivo para MinIO"""
    try:
        arquivo_url = None
        
        # Processar upload do arquivo se fornecido
        if file:
            # Validar tipo de arquivo
            allowed_types = [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
                'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv',
                'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain', 'text/csv'
            ]
            
            if file.content_type not in allowed_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Tipo de arquivo não permitido: {file.content_type}"
                )
            
            # Validar tamanho (50MB máximo)
            if file.size and file.size > 50 * 1024 * 1024:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Arquivo muito grande. Máximo: 50MB"
                )
            
            # Upload para MinIO
            try:
                object_name = minio_service.upload_file(file, folder="criativos")
                arquivo_url = object_name  # Salvar o object_name do MinIO
                # Detectar tipo de arquivo automaticamente baseado no MIME type
                tipo_arquivo = get_file_type_from_mime(file.content_type)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Erro no upload do arquivo: {str(e)}"
                )
        
        # Processar data de prazo
        prazo_datetime = None
        if prazo:
            try:
                prazo_datetime = datetime.fromisoformat(prazo.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Formato de data inválido para prazo"
                )
        
        # Criar objeto CriativoCreate
        criativo_data = CriativoCreate(
            titulo=titulo,
            descricao=descricao,
            tipo_arquivo=tipo_arquivo,
            prioridade=prioridade,
            prazo=prazo_datetime,
            observacoes=observacoes,
            projeto_id=UUID(projeto_id) if projeto_id and projeto_id != "auto" else None,
            arquivo_bruto_url=arquivo_url
        )
        
        criativo_service = CriativoService(db)
        return criativo_service.create_criativo(
            criativo_data, 
            current_user.id, 
            user_is_admin=current_user.is_admin
        )
    except ValueError as e:
        # Se houve erro e arquivo foi enviado, tentar limpar do MinIO
        if 'arquivo_url' in locals() and arquivo_url:
            try:
                minio_service.delete_file(arquivo_url)
            except:
                pass  # Ignorar erro de limpeza
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        # Re-raise HTTPExceptions
        raise
    except Exception as e:
        # Se houve erro e arquivo foi enviado, tentar limpar do MinIO
        if 'arquivo_url' in locals() and arquivo_url:
            try:
                minio_service.delete_file(arquivo_url)
            except:
                pass  # Ignorar erro de limpeza
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )


@router.get("/", response_model=List[CriativoResponse])
def list_criativos(
    projeto_id: Optional[UUID] = Query(None, description="Filtrar por projeto"),
    status: Optional[StatusCriativoSchema] = Query(None, description="Filtrar por status"),
    tipo_arquivo: Optional[str] = Query(None, description="Filtrar por tipo de arquivo"),
    skip: int = Query(0, ge=0, description="Pular registros"),
    limit: int = Query(100, ge=1, le=100, description="Limite de registros"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar criativos acessíveis ao usuário"""
    criativo_service = CriativoService(db)
    return criativo_service.get_user_criativos(
        user_id=current_user.id,
        user_is_admin=current_user.is_admin,
        projeto_id=projeto_id,
        status=status,
        tipo_arquivo=tipo_arquivo,
        skip=skip,
        limit=limit
    )


@router.get("/kanban", response_model=CriativosKanbanResponse)
def get_kanban_view(
    projeto_id: Optional[UUID] = Query(None, description="Filtrar por projeto"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Buscar criativos organizados para visualização Kanban (filtrado por usuário)"""
    criativo_service = CriativoService(db)
    return criativo_service.get_user_kanban_view(
        user_id=current_user.id,
        user_is_admin=current_user.is_admin,
        projeto_id=projeto_id
    )


@router.get("/stats", response_model=CriativosStats)
def get_criativos_stats(
    projeto_id: Optional[UUID] = Query(None, description="Filtrar por projeto"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Buscar estatísticas dos criativos (filtrado por usuário)"""
    criativo_service = CriativoService(db)
    return criativo_service.get_user_stats(
        user_id=current_user.id,
        user_is_admin=current_user.is_admin,
        projeto_id=projeto_id
    )


@router.get("/{criativo_id}", response_model=CriativoResponse)
def get_criativo(
    criativo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Buscar criativo por ID"""
    criativo_service = CriativoService(db)
    criativo = criativo_service.get_criativo(criativo_id)
    
    if not criativo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Criativo não encontrado"
        )
    
    return criativo


@router.put("/{criativo_id}", response_model=CriativoResponse)
def update_criativo(
    criativo_id: UUID,
    criativo_update: CriativoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar criativo"""
    criativo_service = CriativoService(db)
    criativo = criativo_service.update_criativo(
        criativo_id, 
        criativo_update, 
        current_user.id
    )
    
    if not criativo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Criativo não encontrado"
        )
    
    return criativo


@router.patch("/{criativo_id}/status", response_model=CriativoResponse)
def change_criativo_status(
    criativo_id: UUID,
    new_status: StatusCriativoSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Alterar status do criativo"""
    criativo_service = CriativoService(db)
    criativo = criativo_service.change_status(
        criativo_id, 
        StatusCriativo(new_status.value), 
        current_user.id
    )
    
    if not criativo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Criativo não encontrado"
        )
    
    return criativo


@router.delete("/{criativo_id}")
def delete_criativo(
    criativo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar criativo"""
    criativo_service = CriativoService(db)
    
    if not criativo_service.delete_criativo(criativo_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Criativo não encontrado"
        )
    
    return {"message": "Criativo deletado com sucesso"}


@router.get("/{criativo_id}/download")
def get_criativo_file_url(
    criativo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter URL de download do arquivo do criativo"""
    criativo_service = CriativoService(db)
    criativo = criativo_service.get_criativo(criativo_id)
    
    if not criativo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Criativo não encontrado"
        )
    
    # Verificar se o criativo tem arquivo
    if not criativo.arquivo_bruto_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Este criativo não possui arquivo"
        )
    
    try:
        # Gerar URL presignada do MinIO (válida por 1 hora)
        download_url = minio_service.get_download_url(criativo.arquivo_bruto_url, expires_in_seconds=3600)
        return {"download_url": download_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar URL de download: {str(e)}"
        ) 