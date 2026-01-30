#!/usr/bin/env python3
"""
Script para migrar a tabela leads para a nova estrutura
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import engine
from sqlalchemy import text

def migrate_leads_table():
    """Adiciona colunas necessárias à tabela leads"""
    
    with engine.connect() as conn:
        try:
            # Verificar se as colunas já existem
            inspector = __import__('sqlalchemy', fromlist=['inspect']).inspect(engine)
            existing_columns = [col['name'] for col in inspector.get_columns('leads')]
            
            print("Colunas existentes:", existing_columns)
            
            # Adicionar colunas que faltam
            if 'status' not in existing_columns:
                print("Adicionando coluna 'status'...")
                conn.execute(text("""
                    ALTER TABLE leads 
                    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'FREE';
                """))
                conn.commit()
            
            if 'column_id' not in existing_columns:
                print("Adicionando coluna 'column_id'...")
                conn.execute(text("""
                    ALTER TABLE leads 
                    ADD COLUMN IF NOT EXISTS column_id UUID REFERENCES kanban_columns(id) ON DELETE SET NULL;
                """))
                conn.commit()
            
            if 'tags' not in existing_columns:
                print("Adicionando coluna 'tags'...")
                conn.execute(text("""
                    ALTER TABLE leads 
                    ADD COLUMN IF NOT EXISTS tags TEXT[];
                """))
                conn.commit()
            
            if 'observacoes' not in existing_columns:
                # Verificar se 'descricao' existe e pode ser renomeada
                if 'descricao' in existing_columns:
                    print("Renomeando 'descricao' para 'observacoes'...")
                    conn.execute(text("""
                        ALTER TABLE leads 
                        RENAME COLUMN descricao TO observacoes;
                    """))
                    conn.commit()
                else:
                    print("Adicionando coluna 'observacoes'...")
                    conn.execute(text("""
                        ALTER TABLE leads 
                        ADD COLUMN IF NOT EXISTS observacoes TEXT;
                    """))
                    conn.commit()
            
            if 'data_cadastro' not in existing_columns:
                print("Adicionando coluna 'data_cadastro'...")
                conn.execute(text("""
                    ALTER TABLE leads 
                    ADD COLUMN IF NOT EXISTS data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW();
                """))
                # Preencher com created_at se existir
                conn.execute(text("""
                    UPDATE leads 
                    SET data_cadastro = created_at 
                    WHERE data_cadastro IS NULL AND created_at IS NOT NULL;
                """))
                conn.commit()
            
            # Migrar dados de 'stage' para 'status' se necessário
            print("Migrando dados de 'stage' para 'status'...")
            # Primeiro, verificar valores do enum
            try:
                result = conn.execute(text("SELECT unnest(enum_range(NULL::leadstage))::text AS enum_value;"))
                enum_values = [row[0] for row in result]
                print(f"Valores do enum: {enum_values}")
                
                # Converter stage (enum) para status (string)
                # Mapear valores do enum para strings
                stage_mapping = {}
                for val in enum_values:
                    val_upper = val.upper()
                    if 'FREE' in val_upper or 'LIVRE' in val_upper:
                        stage_mapping[val] = 'FREE'
                    elif 'OCCUPIED' in val_upper or 'OCUPADO' in val_upper:
                        stage_mapping[val] = 'OCCUPIED'
                    elif 'CLOSED' in val_upper or 'FECHADO' in val_upper:
                        stage_mapping[val] = 'CLOSED'
                    else:
                        stage_mapping[val] = 'FREE'
                
                # Atualizar status baseado no stage
                for enum_val, status_val in stage_mapping.items():
                    conn.execute(text(f"""
                        UPDATE leads 
                        SET status = :status_val
                        WHERE stage::text = :enum_val 
                        AND (status IS NULL OR status = 'FREE');
                    """), {"status_val": status_val, "enum_val": enum_val})
                conn.commit()
            except Exception as e:
                print(f"Aviso ao migrar stage: {e}")
                # Se não conseguir migrar, apenas definir default
                conn.execute(text("""
                    UPDATE leads 
                    SET status = 'FREE'
                    WHERE status IS NULL;
                """))
                conn.commit()
            
            print("✅ Migração concluída com sucesso!")
            
        except Exception as e:
            print(f"❌ Erro na migração: {e}")
            import traceback
            traceback.print_exc()
            conn.rollback()

if __name__ == "__main__":
    migrate_leads_table()

