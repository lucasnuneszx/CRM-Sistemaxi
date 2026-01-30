from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal
import uuid

from ..models.relatorio_diario import RelatorioDiario
from ..schemas.relatorio_diario import (
    RelatorioDiarioCreate, 
    RelatorioDiarioUpdate, 
    RelatorioDiarioResponse,
    EstatisticasRelatorio,
    FiltroRelatorio
)


class RelatorioDiarioService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_relatorio(self, relatorio_data: RelatorioDiarioCreate) -> RelatorioDiario:
        """Criar um novo relatório diário"""
        # Extrair IDs das atividades antes de criar o relatório
        atividades_ids = relatorio_data.atividades_realizadas_ids or []
        relatorio_dict = relatorio_data.model_dump()
        relatorio_dict.pop('atividades_realizadas_ids', None)
        
        relatorio = RelatorioDiario(**relatorio_dict)
        self.db.add(relatorio)
        self.db.flush()  # Para obter o ID antes do commit
        
        # Associar atividades se houver
        if atividades_ids:
            from app.models.atividade import Atividade
            atividades = self.db.query(Atividade).filter(
                Atividade.id.in_(atividades_ids)
            ).all()
            relatorio.atividades_realizadas = atividades
        
        self.db.commit()
        self.db.refresh(relatorio)
        return relatorio
    
    def get_relatorio_by_id(self, relatorio_id: uuid.UUID) -> Optional[RelatorioDiario]:
        """Buscar relatório por ID"""
        return self.db.query(RelatorioDiario).filter(
            RelatorioDiario.id == relatorio_id
        ).first()
    
    def get_relatorio_by_projeto_and_data(
        self, 
        projeto_id: uuid.UUID, 
        data_referente: date
    ) -> Optional[RelatorioDiario]:
        """Buscar relatório por projeto e data (para evitar duplicatas)"""
        return self.db.query(RelatorioDiario).filter(
            and_(
                RelatorioDiario.projeto_id == projeto_id,
                RelatorioDiario.data_referente == data_referente
            )
        ).first()
    
    def get_relatorios_by_projeto(
        self, 
        projeto_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        filtro: Optional[FiltroRelatorio] = None
    ) -> List[RelatorioDiario]:
        """Listar relatórios de um projeto com filtros opcionais"""
        query = self.db.query(RelatorioDiario).filter(
            RelatorioDiario.projeto_id == projeto_id
        )
        
        if filtro:
            if filtro.data_inicio:
                query = query.filter(RelatorioDiario.data_referente >= filtro.data_inicio)
            if filtro.data_fim:
                query = query.filter(RelatorioDiario.data_referente <= filtro.data_fim)
        
        return query.order_by(RelatorioDiario.data_referente.desc()).offset(skip).limit(limit).all()
    
    def update_relatorio(
        self, 
        relatorio_id: uuid.UUID, 
        relatorio_data: RelatorioDiarioUpdate
    ) -> Optional[RelatorioDiario]:
        """Atualizar um relatório existente"""
        relatorio = self.get_relatorio_by_id(relatorio_id)
        if not relatorio:
            return None
        
        update_data = relatorio_data.model_dump(exclude_unset=True)
        
        # Tratar atividades separadamente
        atividades_ids = update_data.pop('atividades_realizadas_ids', None)
        
        # Atualizar campos normais
        for field, value in update_data.items():
            setattr(relatorio, field, value)
        
        # Atualizar atividades se fornecidas
        if atividades_ids is not None:
            from app.models.atividade import Atividade
            if atividades_ids:
                atividades = self.db.query(Atividade).filter(
                    Atividade.id.in_(atividades_ids)
                ).all()
                relatorio.atividades_realizadas = atividades
            else:
                relatorio.atividades_realizadas = []
        
        relatorio.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(relatorio)
        return relatorio
    
    def delete_relatorio(self, relatorio_id: uuid.UUID) -> bool:
        """Deletar um relatório"""
        relatorio = self.get_relatorio_by_id(relatorio_id)
        if not relatorio:
            return False
        
        self.db.delete(relatorio)
        self.db.commit()
        return True
    
    def get_estatisticas_projeto(
        self, 
        projeto_id: uuid.UUID,
        filtro: Optional[FiltroRelatorio] = None
    ) -> EstatisticasRelatorio:
        """Calcular estatísticas de um projeto"""
        query = self.db.query(RelatorioDiario).filter(
            RelatorioDiario.projeto_id == projeto_id
        )
        
        if filtro:
            if filtro.data_inicio:
                query = query.filter(RelatorioDiario.data_referente >= filtro.data_inicio)
            if filtro.data_fim:
                query = query.filter(RelatorioDiario.data_referente <= filtro.data_fim)
        
        # Agregações
        stats = query.with_entities(
            func.count(RelatorioDiario.id).label('total_relatorios'),
            func.coalesce(func.sum(RelatorioDiario.valor_investido), 0).label('total_valor_investido'),
            func.coalesce(func.sum(RelatorioDiario.leads), 0).label('total_leads'),
            func.coalesce(func.sum(RelatorioDiario.registros), 0).label('total_registros'),
            func.coalesce(func.sum(RelatorioDiario.deposito), 0).label('total_deposito'),
            func.coalesce(func.sum(RelatorioDiario.ftd), 0).label('total_ftd'),
            func.coalesce(func.sum(RelatorioDiario.total_comissao_dia), 0).label('total_comissao'),
            func.avg(RelatorioDiario.custo_por_lead).label('media_custo_por_lead'),
            func.avg(RelatorioDiario.custo_por_registro).label('media_custo_por_registro'),
            func.avg(RelatorioDiario.custo_por_ftd).label('media_custo_por_ftd')
        ).first()
        
        return EstatisticasRelatorio(
            total_relatorios=stats.total_relatorios or 0,
            total_valor_investido=Decimal(str(stats.total_valor_investido or 0)),
            total_leads=stats.total_leads or 0,
            total_registros=stats.total_registros or 0,
            total_deposito=Decimal(str(stats.total_deposito or 0)),
            total_ftd=stats.total_ftd or 0,
            total_comissao=Decimal(str(stats.total_comissao or 0)),
            media_custo_por_lead=Decimal(str(stats.media_custo_por_lead)) if stats.media_custo_por_lead else None,
            media_custo_por_registro=Decimal(str(stats.media_custo_por_registro)) if stats.media_custo_por_registro else None,
            media_custo_por_ftd=Decimal(str(stats.media_custo_por_ftd)) if stats.media_custo_por_ftd else None
        )
    
    def get_relatorios_periodo(
        self,
        projeto_id: uuid.UUID,
        data_inicio: date,
        data_fim: date
    ) -> List[RelatorioDiario]:
        """Buscar relatórios em um período específico"""
        return self.db.query(RelatorioDiario).filter(
            and_(
                RelatorioDiario.projeto_id == projeto_id,
                RelatorioDiario.data_referente >= data_inicio,
                RelatorioDiario.data_referente <= data_fim
            )
        ).order_by(RelatorioDiario.data_referente.asc()).all()
    
    def get_ultimos_relatorios(
        self,
        projeto_id: uuid.UUID,
        limit: int = 7
    ) -> List[RelatorioDiario]:
        """Buscar os últimos N relatórios de um projeto"""
        return self.db.query(RelatorioDiario).filter(
            RelatorioDiario.projeto_id == projeto_id
        ).order_by(RelatorioDiario.data_referente.desc()).limit(limit).all()

    def get_dashboard_consolidado(
        self,
        data_inicio: Optional[date] = None,
        data_fim: Optional[date] = None,
        projeto_id: Optional[uuid.UUID] = None
    ) -> dict:
        """Obter dados consolidados para o dashboard financeiro"""
        from sqlalchemy import extract, func
        from datetime import datetime, timedelta
        
        # Query base
        query = self.db.query(RelatorioDiario)
        
        # Aplicar filtro de projeto se fornecido
        if projeto_id:
            query = query.filter(RelatorioDiario.projeto_id == projeto_id)
        
        # Aplicar filtros de data se fornecidos
        if data_inicio:
            query = query.filter(RelatorioDiario.data_referente >= data_inicio)
        if data_fim:
            query = query.filter(RelatorioDiario.data_referente <= data_fim)
            
        # Se não há filtros, usar últimos 6 meses
        if not data_inicio and not data_fim:
            seis_meses_atras = datetime.now().date() - timedelta(days=180)
            query = query.filter(RelatorioDiario.data_referente >= seis_meses_atras)
        
        # Dados mensais agrupados
        monthly_query = self.db.query(
            extract('year', RelatorioDiario.data_referente).label('ano'),
            extract('month', RelatorioDiario.data_referente).label('mes'),
            func.coalesce(func.sum(RelatorioDiario.valor_investido), 0).label('total_investido'),
            func.coalesce(func.sum(RelatorioDiario.deposito), 0).label('total_deposito'),
            func.coalesce(func.sum(RelatorioDiario.total_comissao_dia), 0).label('total_comissao'),
            func.coalesce(func.sum(RelatorioDiario.leads), 0).label('total_leads'),
            func.coalesce(func.sum(RelatorioDiario.registros), 0).label('total_registros'),
            func.coalesce(func.sum(RelatorioDiario.ftd), 0).label('total_ftd')
        )
        
        # Aplicar filtros na query mensal
        if projeto_id:
            monthly_query = monthly_query.filter(RelatorioDiario.projeto_id == projeto_id)
        
        monthly_query = monthly_query.filter(
            RelatorioDiario.data_referente >= (data_inicio or datetime.now().date() - timedelta(days=180))
        ).group_by(
            extract('year', RelatorioDiario.data_referente),
            extract('month', RelatorioDiario.data_referente)
        ).order_by('ano', 'mes')
        
        monthly_data = monthly_query.all()
        
        # Converter para formato do dashboard
        monthly_chart_data = []
        for row in monthly_data:
            month_name = datetime(int(row.ano), int(row.mes), 1).strftime('%b')
            # Calcular lucro como receita - investimento
            faturamento = float(row.total_deposito or 0) + float(row.total_comissao or 0)
            despesas = float(row.total_investido or 0)
            lucro = faturamento - despesas
            
            monthly_chart_data.append({
                'month': month_name,
                'faturamento': round(faturamento, 2),
                'despesas': round(despesas, 2),
                'lucro': round(lucro, 2),
                'roi': round(lucro / despesas, 2) if despesas > 0 else 0
            })
        
        # Estatísticas totais do período
        total_stats = query.with_entities(
            func.coalesce(func.sum(RelatorioDiario.valor_investido), 0).label('total_investido'),
            func.coalesce(func.sum(RelatorioDiario.deposito), 0).label('total_deposito'),
            func.coalesce(func.sum(RelatorioDiario.total_comissao_dia), 0).label('total_comissao'),
            func.coalesce(func.sum(RelatorioDiario.revshare), 0).label('total_revshare'),
            func.coalesce(func.sum(RelatorioDiario.leads), 0).label('total_leads'),
            func.coalesce(func.sum(RelatorioDiario.registros), 0).label('total_registros'),
            func.coalesce(func.sum(RelatorioDiario.ftd), 0).label('total_ftd'),
            func.count(RelatorioDiario.id).label('total_relatorios')
        ).first()
        
        # Calcular métricas financeiras
        total_faturamento = float(total_stats.total_deposito or 0) + float(total_stats.total_comissao or 0)
        total_despesas = float(total_stats.total_investido or 0)
        total_lucro = total_faturamento - total_despesas
        roi_medio = total_lucro / total_despesas if total_despesas > 0 else 0
        
        # Dados do mês atual vs anterior (para cálculo de crescimento)
        current_month_data = monthly_chart_data[-1] if monthly_chart_data else None
        previous_month_data = monthly_chart_data[-2] if len(monthly_chart_data) > 1 else None
        
        crescimento_faturamento = 0
        crescimento_lucro = 0
        
        if current_month_data and previous_month_data:
            if previous_month_data['faturamento'] > 0:
                crescimento_faturamento = round(
                    ((current_month_data['faturamento'] - previous_month_data['faturamento']) / 
                     previous_month_data['faturamento']) * 100, 1
                )
            if previous_month_data['lucro'] != 0:
                crescimento_lucro = round(
                    ((current_month_data['lucro'] - previous_month_data['lucro']) / 
                     abs(previous_month_data['lucro'])) * 100, 1
                )
        
        # Distribuição de despesas por categoria (mockado por enquanto, pode ser expandido)
        expense_categories = [
            {"name": "Investimento Publicitário", "value": float(total_stats.total_investido or 0), "color": "#3b82f6"},
            {"name": "Operacional", "value": round(float(total_stats.total_investido or 0) * 0.2, 2), "color": "#10b981"},
            {"name": "Tecnologia", "value": round(float(total_stats.total_investido or 0) * 0.1, 2), "color": "#f59e0b"},
            {"name": "Outros", "value": round(float(total_stats.total_investido or 0) * 0.05, 2), "color": "#ef4444"}
        ]
        
        return {
            "resumo_financeiro": {
                "faturamento_atual": current_month_data['faturamento'] if current_month_data else 0,
                "lucro_atual": current_month_data['lucro'] if current_month_data else 0,
                "despesas_atuais": current_month_data['despesas'] if current_month_data else 0,
                "roi_atual": current_month_data['roi'] if current_month_data else 0,
                "crescimento_faturamento": crescimento_faturamento,
                "crescimento_lucro": crescimento_lucro,
                "meta_mensal": 60000  # Pode ser configurável
            },
            "dados_mensais": monthly_chart_data,
            "categorias_despesas": expense_categories,
            "metricas_totais": {
                "total_faturamento": round(total_faturamento, 2),
                "total_despesas": round(total_despesas, 2),
                "total_lucro": round(total_lucro, 2),
                "roi_medio": round(roi_medio, 2),
                "total_leads": int(total_stats.total_leads or 0),
                "total_registros": int(total_stats.total_registros or 0),
                "total_ftd": int(total_stats.total_ftd or 0),
                "total_relatorios": int(total_stats.total_relatorios or 0),
                "total_depositos": int(total_stats.total_ftd or 0),  # FTD representa depósitos únicos
                "total_valor_depositos": round(float(total_stats.total_deposito or 0), 2),  # Valor total depositado
                "revshare": round(float(total_stats.total_revshare or 0), 2)  # Total de revshare
            }
        } 