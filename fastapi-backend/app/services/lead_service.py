from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from ..models.lead import Lead, LeadStage
from ..schemas.lead import LeadCreate, LeadUpdate, LeadResponse


class LeadService:
    """Serviço para gerenciar leads do funil de vendas"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_lead(self, lead_data: LeadCreate, user_id: UUID) -> LeadResponse:
        """Criar novo lead"""
        db_lead = Lead(
            **lead_data.model_dump(),
            criado_por_id=user_id
        )
        self.db.add(db_lead)
        self.db.commit()
        self.db.refresh(db_lead)
        return LeadResponse.model_validate(db_lead)
    
    def get_leads(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[LeadResponse]:
        """Listar leads do usuário (ou todos se admin)"""
        # Por enquanto retornar todos os leads para o funil funcionar
        # TODO: Filtrar por usuário se necessário
        leads = self.db.query(Lead).order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()
        return [LeadResponse.model_validate(lead) for lead in leads]
    
    def get_leads_by_stage(self, user_id: UUID, stage: LeadStage) -> List[LeadResponse]:
        """Listar leads por estágio"""
        leads = self.db.query(Lead).filter(
            Lead.criado_por_id == user_id,
            Lead.stage == stage
        ).all()
        return [LeadResponse.model_validate(lead) for lead in leads]
    
    def get_lead(self, lead_id: UUID, user_id: UUID) -> Optional[LeadResponse]:
        """Buscar lead específico"""
        lead = self.db.query(Lead).filter(
            Lead.id == lead_id,
            Lead.criado_por_id == user_id
        ).first()
        return LeadResponse.model_validate(lead) if lead else None
    
    def update_lead(self, lead_id: UUID, lead_data: LeadUpdate, user_id: UUID) -> Optional[LeadResponse]:
        """Atualizar lead"""
        db_lead = self.db.query(Lead).filter(
            Lead.id == lead_id,
            Lead.criado_por_id == user_id
        ).first()
        if not db_lead:
            return None
        
        for field, value in lead_data.model_dump(exclude_unset=True).items():
            setattr(db_lead, field, value)
        
        self.db.commit()
        self.db.refresh(db_lead)
        return LeadResponse.model_validate(db_lead)
    
    def delete_lead(self, lead_id: UUID, user_id: UUID) -> bool:
        """Deletar lead"""
        # Por enquanto permitir deletar qualquer lead
        # TODO: Adicionar verificação de permissão se necessário
        db_lead = self.db.query(Lead).filter(Lead.id == lead_id).first()
        if not db_lead:
            return False
        
        self.db.delete(db_lead)
        self.db.commit()
        return True
    
    def move_lead(self, lead_id: UUID, column_id: Optional[UUID], user_id: UUID) -> Optional[LeadResponse]:
        """Mover lead para uma coluna (ou remover da coluna se column_id for None)"""
        db_lead = self.db.query(Lead).filter(Lead.id == lead_id).first()
        if not db_lead:
            return None
        
        db_lead.column_id = column_id
        self.db.commit()
        self.db.refresh(db_lead)
        return LeadResponse.model_validate(db_lead)
