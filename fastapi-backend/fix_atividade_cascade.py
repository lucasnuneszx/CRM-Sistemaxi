#!/usr/bin/env python3
"""
Script para corrigir a constraint de exclusão em cascata na tabela atividades
"""
from sqlalchemy import text
from app.core.database import engine

def fix_atividade_cascade():
    """Fix the foreign key constraint to support CASCADE DELETE"""
    print("🔧 Corrigindo constraint de exclusão em cascata para atividades...")
    
    try:
        with engine.connect() as connection:
            with connection.begin():
                # Drop the existing foreign key constraint
                print("📝 Removendo constraint existente...")
                connection.execute(text("""
                    ALTER TABLE atividades 
                    DROP CONSTRAINT IF EXISTS atividades_projeto_id_fkey;
                """))
                
                # Add the new foreign key constraint with CASCADE DELETE
                print("📝 Adicionando nova constraint com CASCADE...")
                connection.execute(text("""
                    ALTER TABLE atividades 
                    ADD CONSTRAINT atividades_projeto_id_fkey 
                    FOREIGN KEY (projeto_id) REFERENCES projects(id) 
                    ON DELETE CASCADE;
                """))
                
        print("✅ Constraint atualizada com sucesso!")
        print("🎉 Agora a exclusão de projetos irá excluir automaticamente as atividades relacionadas")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao atualizar constraint: {e}")
        return False

if __name__ == "__main__":
    fix_atividade_cascade() 