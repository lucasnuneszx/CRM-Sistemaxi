from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
import uuid

from ..models.credencial_acesso import CredencialAcesso
from ..schemas.credencial_acesso import (
    CredencialAcessoCreate,
    CredencialAcessoUpdate,
    CredencialAcessoResponse,
    CredencialAcessoListResponse
)


class CredencialAcessoService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_credencial(self, credencial_data: CredencialAcessoCreate) -> CredencialAcesso:
        """Criar uma nova credencial"""
        credencial_dict = credencial_data.model_dump()
        
        credencial = CredencialAcesso(**credencial_dict)
        self.db.add(credencial)
        self.db.commit()
        self.db.refresh(credencial)
        return credencial
    
    def get_credencial_by_id(self, credencial_id: uuid.UUID) -> Optional[CredencialAcesso]:
        """Buscar credencial por ID"""
        return self.db.query(CredencialAcesso).filter(
            CredencialAcesso.id == credencial_id
        ).first()
    
    def get_credenciais_by_projeto(
        self, 
        projeto_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        apenas_ativas: bool = True
    ) -> List[CredencialAcesso]:
        """Listar credenciais de um projeto"""
        query = self.db.query(CredencialAcesso).filter(
            CredencialAcesso.projeto_id == projeto_id
        )
        
        if apenas_ativas:
            query = query.filter(CredencialAcesso.ativo == True)
        
        return query.order_by(CredencialAcesso.created_at.desc()).offset(skip).limit(limit).all()
    
    def update_credencial(
        self, 
        credencial_id: uuid.UUID, 
        credencial_update: CredencialAcessoUpdate
    ) -> Optional[CredencialAcesso]:
        """Atualizar uma credencial"""
        credencial = self.get_credencial_by_id(credencial_id)
        if not credencial:
            return None
        
        update_data = credencial_update.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(credencial, field, value)
        
        self.db.commit()
        self.db.refresh(credencial)
        return credencial
    
    def delete_credencial(self, credencial_id: uuid.UUID) -> bool:
        """Deletar uma credencial"""
        credencial = self.get_credencial_by_id(credencial_id)
        if not credencial:
            return False
        
        self.db.delete(credencial)
        self.db.commit()
        return True
    
    def toggle_ativo(self, credencial_id: uuid.UUID) -> Optional[CredencialAcesso]:
        """Alternar status ativo/inativo"""
        credencial = self.get_credencial_by_id(credencial_id)
        if not credencial:
            return None
        
        credencial.ativo = not credencial.ativo
        self.db.commit()
        self.db.refresh(credencial)
        return credencial
    
    def search_credenciais(
        self,
        projeto_id: uuid.UUID,
        termo: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[CredencialAcesso]:
        """Buscar credenciais por termo"""
        return self.db.query(CredencialAcesso).filter(
            and_(
                CredencialAcesso.projeto_id == projeto_id,
                CredencialAcesso.ativo == True,
                CredencialAcesso.nome_acesso.ilike(f"%{termo}%") | 
                CredencialAcesso.plataforma.ilike(f"%{termo}%") |
                CredencialAcesso.usuario.ilike(f"%{termo}%")
            )
        ).order_by(CredencialAcesso.created_at.desc()).offset(skip).limit(limit).all() 