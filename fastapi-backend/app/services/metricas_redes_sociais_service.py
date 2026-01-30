from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from typing import List, Optional
from datetime import date, datetime
import uuid

from ..models.metricas_redes_sociais import MetricasRedesSociais
from ..schemas.metricas_redes_sociais import (
    MetricasRedesSociaisCreate,
    MetricasRedesSociaisUpdate,
    EstatisticasRedesSociais,
    FiltroMetricasRedesSociais
)


class MetricasRedesSociaisService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_metricas(self, metricas_data: MetricasRedesSociaisCreate) -> MetricasRedesSociais:
        """Criar novas métricas de redes sociais"""
        metricas_dict = metricas_data.model_dump()
        metricas = MetricasRedesSociais(**metricas_dict)
        
        self.db.add(metricas)
        self.db.commit()
        self.db.refresh(metricas)
        return metricas
    
    def get_metricas_by_id(self, metricas_id: uuid.UUID) -> Optional[MetricasRedesSociais]:
        """Buscar métricas por ID"""
        return self.db.query(MetricasRedesSociais).filter(
            MetricasRedesSociais.id == metricas_id
        ).first()
    
    def get_metricas_by_projeto_and_data(
        self, 
        projeto_id: uuid.UUID, 
        data_referente: date
    ) -> Optional[MetricasRedesSociais]:
        """Buscar métricas por projeto e data (para evitar duplicatas)"""
        return self.db.query(MetricasRedesSociais).filter(
            and_(
                MetricasRedesSociais.projeto_id == projeto_id,
                MetricasRedesSociais.data_referente == data_referente
            )
        ).first()
    
    def get_metricas_by_projeto(
        self, 
        projeto_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        filtro: Optional[FiltroMetricasRedesSociais] = None
    ) -> List[MetricasRedesSociais]:
        """Listar métricas de um projeto com filtros opcionais"""
        query = self.db.query(MetricasRedesSociais).filter(
            MetricasRedesSociais.projeto_id == projeto_id
        )
        
        if filtro:
            if filtro.data_inicio:
                query = query.filter(MetricasRedesSociais.data_referente >= filtro.data_inicio)
            if filtro.data_fim:
                query = query.filter(MetricasRedesSociais.data_referente <= filtro.data_fim)
        
        return query.order_by(MetricasRedesSociais.data_referente.desc()).offset(skip).limit(limit).all()
    
    def update_metricas(
        self, 
        metricas_id: uuid.UUID, 
        metricas_update: MetricasRedesSociaisUpdate
    ) -> Optional[MetricasRedesSociais]:
        """Atualizar métricas existentes"""
        metricas = self.get_metricas_by_id(metricas_id)
        if not metricas:
            return None
        
        update_data = metricas_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(metricas, field, value)
        
        self.db.commit()
        self.db.refresh(metricas)
        return metricas
    
    def delete_metricas(self, metricas_id: uuid.UUID) -> bool:
        """Deletar métricas"""
        metricas = self.get_metricas_by_id(metricas_id)
        if not metricas:
            return False
        
        self.db.delete(metricas)
        self.db.commit()
        return True
    
    def get_estatisticas_projeto(
        self, 
        projeto_id: uuid.UUID,
        filtro: Optional[FiltroMetricasRedesSociais] = None
    ) -> EstatisticasRedesSociais:
        """Calcular estatísticas de redes sociais de um projeto"""
        query = self.db.query(MetricasRedesSociais).filter(
            MetricasRedesSociais.projeto_id == projeto_id
        )
        
        if filtro:
            if filtro.data_inicio:
                query = query.filter(MetricasRedesSociais.data_referente >= filtro.data_inicio)
            if filtro.data_fim:
                query = query.filter(MetricasRedesSociais.data_referente <= filtro.data_fim)
        
        # Contar total de registros
        total_registros = query.count()
        
        if total_registros == 0:
            return EstatisticasRedesSociais(
                total_registros=0,
                maior_crescimento_instagram=None,
                maior_crescimento_telegram=None,
                maior_crescimento_whatsapp=None,
                maior_crescimento_facebook=None,
                maior_crescimento_youtube=None,
                maior_crescimento_tiktok=None,
                total_seguidores_instagram=None,
                total_inscritos_telegram=None,
                total_leads_whatsapp=None,
                total_seguidores_facebook=None,
                total_inscritos_youtube=None,
                total_seguidores_tiktok=None
            )
        
        # Buscar últimos valores para cada rede social
        latest_metrics = query.order_by(MetricasRedesSociais.data_referente.desc()).first()
        
        return EstatisticasRedesSociais(
            total_registros=total_registros,
            maior_crescimento_instagram=None,  # Implementar cálculo de crescimento depois
            maior_crescimento_telegram=None,
            maior_crescimento_whatsapp=None,
            maior_crescimento_facebook=None,
            maior_crescimento_youtube=None,
            maior_crescimento_tiktok=None,
            total_seguidores_instagram=latest_metrics.seguidores_instagram,
            total_inscritos_telegram=latest_metrics.inscritos_telegram,
            total_leads_whatsapp=latest_metrics.leads_whatsapp,
            total_seguidores_facebook=latest_metrics.seguidores_facebook,
            total_inscritos_youtube=latest_metrics.inscritos_youtube,
            total_seguidores_tiktok=latest_metrics.seguidores_tiktok
        )
    
    def get_metricas_periodo(
        self,
        projeto_id: uuid.UUID,
        data_inicio: date,
        data_fim: date
    ) -> List[MetricasRedesSociais]:
        """Buscar métricas em um período específico"""
        return self.db.query(MetricasRedesSociais).filter(
            and_(
                MetricasRedesSociais.projeto_id == projeto_id,
                MetricasRedesSociais.data_referente >= data_inicio,
                MetricasRedesSociais.data_referente <= data_fim
            )
        ).order_by(MetricasRedesSociais.data_referente.asc()).all()
    
    def get_ultimas_metricas(
        self,
        projeto_id: uuid.UUID,
        limit: int = 7
    ) -> List[MetricasRedesSociais]:
        """Buscar as últimas N métricas de um projeto"""
        return self.db.query(MetricasRedesSociais).filter(
            MetricasRedesSociais.projeto_id == projeto_id
        ).order_by(MetricasRedesSociais.data_referente.desc()).limit(limit).all() 