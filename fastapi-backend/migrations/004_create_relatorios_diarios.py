import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from sqlalchemy import text


def upgrade():
    """Criar tabela relatorios_diarios"""
    
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS relatorios_diarios (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                projeto_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                
                -- Data de referência do relatório
                data_referente DATE NOT NULL,
                
                -- Atividades realizadas (checkboxes)
                criacao_criativos BOOLEAN DEFAULT FALSE,
                identidade_visual BOOLEAN DEFAULT FALSE,
                outras_atividades TEXT,
                
                -- Métricas de investimento
                valor_investido NUMERIC(10, 2),
                
                -- Métricas de leads
                leads INTEGER,
                custo_por_lead NUMERIC(10, 2),
                
                -- Métricas de registros
                registros INTEGER,
                custo_por_registro NUMERIC(10, 2),
                
                -- Métricas de depósito
                deposito NUMERIC(12, 2),
                
                -- Métricas de FTD (First Time Deposit)
                ftd INTEGER,
                custo_por_ftd NUMERIC(10, 2),
                valor_ftd NUMERIC(12, 2),
                
                -- Métricas de CPA
                cpa INTEGER,
                comissao_cpa NUMERIC(10, 2),
                
                -- Revshare
                revshare NUMERIC(10, 2),
                
                -- Total de comissão do dia
                total_comissao_dia NUMERIC(10, 2),
                
                -- Observações gerais
                observacoes TEXT,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraint para evitar duplicatas de data por projeto
                UNIQUE(projeto_id, data_referente)
            );
        """))
        
        # Criar índices para melhor performance
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_relatorios_diarios_projeto_id ON relatorios_diarios(projeto_id);
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_relatorios_diarios_data_referente ON relatorios_diarios(data_referente);
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_relatorios_diarios_projeto_data ON relatorios_diarios(projeto_id, data_referente);
        """))
        
        conn.commit()
        print("✅ Tabela relatorios_diarios criada com sucesso!")


def downgrade():
    """Reverter criação da tabela relatorios_diarios"""
    
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS relatorios_diarios CASCADE;"))
        conn.commit()
        print("✅ Tabela relatorios_diarios removida com sucesso!")


if __name__ == "__main__":
    upgrade() 