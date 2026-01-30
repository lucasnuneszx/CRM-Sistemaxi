from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import uuid
import logging

from ....core.database import get_db
from ....schemas.notificacao import (
    NotificacaoCreate,
    NotificacaoResponse,
    NotificacaoUpdate,
    NotificacaoCountResponse
)
from ....services.notificacao_service import NotificacaoService
from ....models.user import User
from ....models.notificacao import Notificacao
from ...deps import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter()


def serialize_notificacao(notificacao: Notificacao) -> NotificacaoResponse:
    """Serializar notificação ORM para resposta"""
    from_user_name = None
    from_user_avatar = None
    
    if notificacao.from_user:
        from_user_name = notificacao.from_user.name
        # Se houver foto de perfil, gerar presigned URL
        if notificacao.from_user.foto_perfil:
            try:
                from ....services.minio_service import minio_service
                from_user_avatar = minio_service.get_download_url(
                    notificacao.from_user.foto_perfil,
                    expires_in_seconds=604800
                )
            except Exception as e:
                logger.warning(f"Erro ao gerar URL da foto: {e}")
    
    return NotificacaoResponse(
        id=notificacao.id,
        tipo=notificacao.tipo,
        titulo=notificacao.titulo,
        mensagem=notificacao.mensagem,
        usuario_id=notificacao.usuario_id,
        from_user_id=notificacao.from_user_id,
        from_user_name=from_user_name,
        from_user_avatar=from_user_avatar,
        contexto_tipo=notificacao.contexto_tipo,
        contexto_id=notificacao.contexto_id,
        contexto_nome=notificacao.contexto_nome,
        action_url=notificacao.action_url,
        status=notificacao.status,
        created_at=notificacao.created_at,
        updated_at=notificacao.updated_at,
        read_at=notificacao.read_at
    )


@router.post("/", response_model=NotificacaoResponse)
def criar_notificacao(
    notificacao: NotificacaoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Criar uma notificação (apenas admin ou gestor de projeto)"""
    # Verificar permissão
    if not NotificacaoService.verificar_permissao_criar(db, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e gestores de projeto podem criar notificações"
        )
    
    # Validar que usuario_id foi fornecido
    if not notificacao.usuario_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="usuario_id é obrigatório para criar uma notificação única"
        )
    
    # Se from_user_id não foi especificado, usar o usuário atual
    from_user_id = notificacao.from_user_id or current_user.id
    
    db_notificacao = NotificacaoService.criar_notificacao(
        db=db,
        notificacao=notificacao,
        from_user_id=from_user_id
    )
    
    # Carregar relacionamentos
    db_notificacao = db.query(Notificacao).options(
        joinedload(Notificacao.from_user)
    ).filter(Notificacao.id == db_notificacao.id).first()
    
    return serialize_notificacao(db_notificacao)


@router.post("/multiple", response_model=List[NotificacaoResponse])
def criar_notificacao_multiplos(
    notificacao: NotificacaoCreate,
    usuario_ids: List[uuid.UUID] = Query(..., description="Lista de IDs dos usuários destinatários"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Criar notificações para múltiplos usuários (apenas admin ou gestor de projeto)"""
    # Verificar permissão
    if not NotificacaoService.verificar_permissao_criar(db, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e gestores de projeto podem criar notificações"
        )
    
    if not usuario_ids or len(usuario_ids) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selecione pelo menos um usuário destinatário"
        )
    
    from_user_id = notificacao.from_user_id or current_user.id
    
    db_notificacoes = NotificacaoService.criar_notificacao_multiplos_usuarios(
        db=db,
        notificacao=notificacao,
        usuario_ids=usuario_ids,
        from_user_id=from_user_id
    )
    
    # Carregar relacionamentos
    notif_ids = [n.id for n in db_notificacoes]
    notificacoes_com_relacoes = db.query(Notificacao).options(
        joinedload(Notificacao.from_user)
    ).filter(Notificacao.id.in_(notif_ids)).all()
    
    return [serialize_notificacao(n) for n in notificacoes_com_relacoes]


@router.get("/", response_model=List[NotificacaoResponse])
@router.get("", response_model=List[NotificacaoResponse])
def listar_notificacoes(
    skip: int = 0,
    limit: int = 100,
    apenas_nao_lidas: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Listar notificações do usuário atual"""
    notificacoes = NotificacaoService.listar_notificacoes_usuario(
        db=db,
        usuario_id=current_user.id,
        skip=skip,
        limit=limit,
        apenas_nao_lidas=apenas_nao_lidas
    )
    
    # Carregar relacionamentos
    notif_ids = [n.id for n in notificacoes]
    notificacoes_com_relacoes = db.query(Notificacao).options(
        joinedload(Notificacao.from_user)
    ).filter(Notificacao.id.in_(notif_ids)).all()
    
    return [serialize_notificacao(n) for n in notificacoes_com_relacoes]


@router.get("/count", response_model=NotificacaoCountResponse)
def contar_notificacoes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Contar notificações do usuário atual"""
    counts = NotificacaoService.contar_notificacoes_usuario(
        db=db,
        usuario_id=current_user.id
    )
    return NotificacaoCountResponse(**counts)


@router.patch("/{notificacao_id}/read", response_model=NotificacaoResponse)
def marcar_como_lida(
    notificacao_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Marcar notificação como lida"""
    notificacao = NotificacaoService.marcar_como_lida(
        db=db,
        notificacao_id=notificacao_id,
        usuario_id=current_user.id
    )
    
    if not notificacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificação não encontrada"
        )
    
    # Carregar relacionamentos
    notificacao = db.query(Notificacao).options(
        joinedload(Notificacao.from_user)
    ).filter(Notificacao.id == notificacao.id).first()
    
    return serialize_notificacao(notificacao)


@router.post("/read-all")
def marcar_todas_como_lidas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Marcar todas as notificações como lidas"""
    count = NotificacaoService.marcar_todas_como_lidas(
        db=db,
        usuario_id=current_user.id
    )
    return {"message": f"{count} notificações marcadas como lidas"}


@router.delete("/{notificacao_id}")
def deletar_notificacao(
    notificacao_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Deletar uma notificação"""
    success = NotificacaoService.deletar_notificacao(
        db=db,
        notificacao_id=notificacao_id,
        usuario_id=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificação não encontrada"
        )
    
    return {"message": "Notificação deletada com sucesso"}

