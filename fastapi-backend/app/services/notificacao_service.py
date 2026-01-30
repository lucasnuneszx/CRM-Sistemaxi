from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime
from ..models.notificacao import Notificacao, NotificationType, NotificationStatus
from ..schemas.notificacao import NotificacaoCreate, NotificacaoUpdate
from ..models.user import User


class NotificacaoService:
    """Serviço para gerenciar notificações"""
    
    @staticmethod
    def criar_notificacao(
        db: Session,
        notificacao: NotificacaoCreate,
        from_user_id: Optional[uuid.UUID] = None
    ) -> Notificacao:
        """Criar uma nova notificação"""
        if not notificacao.usuario_id:
            raise ValueError("usuario_id é obrigatório para criar uma notificação única")
        
        db_notificacao = Notificacao(
            tipo=notificacao.tipo,
            titulo=notificacao.titulo,
            mensagem=notificacao.mensagem,
            usuario_id=notificacao.usuario_id,
            from_user_id=from_user_id or notificacao.from_user_id,
            contexto_tipo=notificacao.contexto_tipo,
            contexto_id=notificacao.contexto_id,
            contexto_nome=notificacao.contexto_nome,
            action_url=notificacao.action_url,
            status=NotificationStatus.UNREAD
        )
        db.add(db_notificacao)
        db.commit()
        db.refresh(db_notificacao)
        return db_notificacao
    
    @staticmethod
    def criar_notificacao_multiplos_usuarios(
        db: Session,
        notificacao: NotificacaoCreate,
        usuario_ids: List[uuid.UUID],
        from_user_id: Optional[uuid.UUID] = None
    ) -> List[Notificacao]:
        """Criar notificações para múltiplos usuários"""
        notificacoes = []
        for usuario_id in usuario_ids:
            db_notificacao = Notificacao(
                tipo=notificacao.tipo,
                titulo=notificacao.titulo,
                mensagem=notificacao.mensagem,
                usuario_id=usuario_id,
                from_user_id=from_user_id or notificacao.from_user_id,
                contexto_tipo=notificacao.contexto_tipo,
                contexto_id=notificacao.contexto_id,
                contexto_nome=notificacao.contexto_nome,
                action_url=notificacao.action_url,
                status=NotificationStatus.UNREAD
            )
            db.add(db_notificacao)
            notificacoes.append(db_notificacao)
        
        db.commit()
        for notif in notificacoes:
            db.refresh(notif)
        return notificacoes
    
    @staticmethod
    def listar_notificacoes_usuario(
        db: Session,
        usuario_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        apenas_nao_lidas: bool = False
    ) -> List[Notificacao]:
        """Listar notificações de um usuário"""
        query = db.query(Notificacao).filter(Notificacao.usuario_id == usuario_id)
        
        if apenas_nao_lidas:
            query = query.filter(Notificacao.status == NotificationStatus.UNREAD)
        
        query = query.order_by(Notificacao.created_at.desc())
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def contar_notificacoes_usuario(
        db: Session,
        usuario_id: uuid.UUID
    ) -> dict:
        """Contar notificações de um usuário"""
        total = db.query(Notificacao).filter(Notificacao.usuario_id == usuario_id).count()
        unread = db.query(Notificacao).filter(
            Notificacao.usuario_id == usuario_id,
            Notificacao.status == NotificationStatus.UNREAD
        ).count()
        urgent = db.query(Notificacao).filter(
            Notificacao.usuario_id == usuario_id,
            Notificacao.status == NotificationStatus.UNREAD,
            Notificacao.tipo.in_([NotificationType.NUDGE, NotificationType.URGENT])
        ).count()
        
        return {
            "total": total,
            "unread": unread,
            "urgent": urgent
        }
    
    @staticmethod
    def marcar_como_lida(
        db: Session,
        notificacao_id: uuid.UUID,
        usuario_id: uuid.UUID
    ) -> Optional[Notificacao]:
        """Marcar notificação como lida"""
        notificacao = db.query(Notificacao).filter(
            Notificacao.id == notificacao_id,
            Notificacao.usuario_id == usuario_id
        ).first()
        
        if notificacao:
            notificacao.status = NotificationStatus.READ
            notificacao.read_at = datetime.utcnow().isoformat()
            db.commit()
            db.refresh(notificacao)
        
        return notificacao
    
    @staticmethod
    def marcar_todas_como_lidas(
        db: Session,
        usuario_id: uuid.UUID
    ) -> int:
        """Marcar todas as notificações de um usuário como lidas"""
        count = db.query(Notificacao).filter(
            Notificacao.usuario_id == usuario_id,
            Notificacao.status == NotificationStatus.UNREAD
        ).update({
            "status": NotificationStatus.READ,
            "read_at": datetime.utcnow().isoformat()
        })
        db.commit()
        return count
    
    @staticmethod
    def deletar_notificacao(
        db: Session,
        notificacao_id: uuid.UUID,
        usuario_id: uuid.UUID
    ) -> bool:
        """Deletar uma notificação"""
        notificacao = db.query(Notificacao).filter(
            Notificacao.id == notificacao_id,
            Notificacao.usuario_id == usuario_id
        ).first()
        
        if notificacao:
            db.delete(notificacao)
            db.commit()
            return True
        return False
    
    @staticmethod
    def verificar_permissao_criar(
        db: Session,
        usuario_id: uuid.UUID
    ) -> bool:
        """Verificar se o usuário pode criar notificações (admin ou gestor de projeto)"""
        usuario = db.query(User).filter(User.id == usuario_id).first()
        if not usuario:
            return False
        
        # Admin sempre pode
        if usuario.is_admin:
            return True
        
        # Verificar se é gestor de projeto (owner de algum projeto)
        from ..models.project import Project
        projeto_count = db.query(Project).filter(Project.owner_id == usuario_id).count()
        return projeto_count > 0

