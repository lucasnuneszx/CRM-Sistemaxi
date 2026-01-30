#!/usr/bin/env python3
"""
Script completo para garantir que todas as tabelas do banco de dados estejam criadas
e com a estrutura correta. Executa verificações e cria/atualiza tabelas conforme necessário.
"""

import sys
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import engine, Base, test_connection, create_tables
from app.models import (
    User, Project, Atividade, Setor, Documento, CasaParceira,
    RelatorioDiario, CredencialAcesso, MetricasRedesSociais,
    Criativo, UserProject, Lead, KanbanColumn, Cliente, Proposta
)
from app.models.finance_transaction import FinanceTransaction
from sqlalchemy import inspect, text
from sqlalchemy.exc import OperationalError

def check_table_exists(table_name: str) -> bool:
    """Verifica se uma tabela existe"""
    try:
        inspector = inspect(engine)
        return inspector.has_table(table_name)
    except Exception as e:
        print(f"⚠️  Erro ao verificar tabela {table_name}: {e}")
        return False

def get_table_columns(table_name: str) -> list:
    """Retorna lista de colunas de uma tabela"""
    try:
        inspector = inspect(engine)
        if inspector.has_table(table_name):
            return [col['name'] for col in inspector.get_columns(table_name)]
        return []
    except Exception as e:
        print(f"⚠️  Erro ao obter colunas de {table_name}: {e}")
        return []

def create_all_tables():
    """Cria todas as tabelas que não existem"""
    print("🔍 Verificando tabelas existentes...")
    print()
    
    # Lista completa de todas as tabelas que devem existir
    required_tables = {
        'users': 'Usuários',
        'setores': 'Setores',
        'projects': 'Projetos',
        'atividades': 'Atividades',
        'clientes': 'Clientes',
        'leads': 'Leads (Funil de Vendas)',
        'kanban_columns': 'Colunas do Kanban',
        'propostas': 'Propostas',
        'documentos': 'Documentos',
        'casas_parceiras': 'Casas Parceiras',
        'relatorios_diarios': 'Relatórios Diários',
        'credenciais_acesso': 'Credenciais de Acesso',
        'metricas_redes_sociais': 'Métricas de Redes Sociais',
        'criativos': 'Criativos',
        'user_projects': 'Usuários-Projetos',
        'finance_transactions': 'Transações Financeiras',
    }
    
    existing_tables = []
    missing_tables = []
    
    for table_name, description in required_tables.items():
        if check_table_exists(table_name):
            existing_tables.append((table_name, description))
            print(f"✅ {table_name:30} ({description})")
        else:
            missing_tables.append((table_name, description))
            print(f"❌ {table_name:30} ({description}) - FALTANDO")
    
    print()
    print(f"📊 Resumo: {len(existing_tables)} tabelas existentes, {len(missing_tables)} faltando")
    print()
    
    if missing_tables:
        print("🔨 Criando tabelas faltantes...")
        try:
            # Importar todos os modelos para garantir que estão registrados
            from app.models import (
                User, Project, Atividade, Setor, Documento, CasaParceira,
                RelatorioDiario, CredencialAcesso, MetricasRedesSociais,
                Criativo, UserProject, Lead, KanbanColumn, Cliente, Proposta
            )
            from app.models.finance_transaction import FinanceTransaction
            
            # Criar todas as tabelas
            Base.metadata.create_all(bind=engine)
            print("✅ Todas as tabelas foram criadas/atualizadas com sucesso!")
            
            # Verificar novamente após criação
            print()
            print("🔍 Verificando tabelas após criação...")
            for table_name, description in missing_tables:
                if check_table_exists(table_name):
                    print(f"✅ {table_name:30} ({description}) - CRIADA")
                else:
                    print(f"⚠️  {table_name:30} ({description}) - FALHOU AO CRIAR")
        except Exception as e:
            print(f"❌ Erro ao criar tabelas: {e}")
            import traceback
            traceback.print_exc()
            return False
    else:
        print("✅ Todas as tabelas necessárias já existem!")
    
    return True

def verify_table_structure():
    """Verifica estrutura das tabelas principais"""
    print()
    print("🔍 Verificando estrutura das tabelas principais...")
    print()
    
    critical_tables = {
        'users': ['id', 'name', 'email', 'username', 'hashed_password', 'is_admin', 'is_active', 'setor_id', 'foto_perfil', 'telefone', 'bio'],
        'projects': ['id', 'name', 'description', 'owner_id', 'status', 'created_at'],
        'atividades': ['id', 'nome', 'descricao', 'status', 'prioridade', 'prazo', 'responsavel_id', 'projeto_id'],
        'clientes': ['id', 'nome', 'email', 'telefone', 'empreendimento', 'created_at'],
        'leads': ['id', 'nome', 'email', 'telefone', 'empresa', 'stage', 'criado_por_id', 'projeto_id', 'column_id'],
        'kanban_columns': ['id', 'title', 'order', 'color'],
        'propostas': ['id', 'titulo', 'descricao', 'status', 'valor', 'cliente_id', 'responsavel_id'],
        'criativos': ['id', 'nome', 'descricao', 'status', 'projeto_id', 'criado_por_id', 'editor_id'],
        'user_projects': ['id', 'user_id', 'project_id', 'role'],
    }
    
    all_ok = True
    for table_name, required_columns in critical_tables.items():
        if check_table_exists(table_name):
            existing_columns = get_table_columns(table_name)
            missing_columns = [col for col in required_columns if col not in existing_columns]
            
            if missing_columns:
                print(f"⚠️  {table_name:30} Faltam colunas: {', '.join(missing_columns)}")
                all_ok = False
            else:
                print(f"✅ {table_name:30} Estrutura completa ({len(existing_columns)} colunas)")
        else:
            print(f"❌ {table_name:30} Tabela não existe")
            all_ok = False
    
    return all_ok

def verify_foreign_keys():
    """Verifica se as foreign keys estão corretas"""
    print()
    print("🔗 Verificando relacionamentos (Foreign Keys)...")
    print()
    
    try:
        # Verificar foreign keys principais
        fk_checks = [
            ("leads", "column_id", "kanban_columns", "id"),
            ("leads", "criado_por_id", "users", "id"),
            ("leads", "projeto_id", "projects", "id"),
            ("propostas", "cliente_id", "clientes", "id"),
            ("propostas", "responsavel_id", "users", "id"),
            ("users", "setor_id", "setores", "id"),
            ("projects", "owner_id", "users", "id"),
            ("atividades", "responsavel_id", "users", "id"),
            ("atividades", "projeto_id", "projects", "id"),
            ("criativos", "criado_por_id", "users", "id"),
            ("criativos", "projeto_id", "projects", "id"),
            ("user_projects", "user_id", "users", "id"),
            ("user_projects", "project_id", "projects", "id"),
        ]
        
        for table_name, fk_column, ref_table, ref_column in fk_checks:
            table_exists = check_table_exists(table_name)
            ref_exists = check_table_exists(ref_table)
            
            if table_exists and ref_exists:
                columns = get_table_columns(table_name)
                if fk_column in columns:
                    print(f"✅ {table_name}.{fk_column} -> {ref_table}.{ref_column}")
                else:
                    print(f"⚠️  {table_name}.{fk_column} -> {ref_table}.{ref_column} (coluna não existe)")
            elif not table_exists:
                print(f"❌ {table_name}.{fk_column} -> {ref_table}.{ref_column} (tabela {table_name} não existe)")
            elif not ref_exists:
                print(f"⚠️  {table_name}.{fk_column} -> {ref_table}.{ref_column} (tabela {ref_table} não existe)")
    except Exception as e:
        print(f"⚠️  Erro ao verificar foreign keys: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 70)
    print("🔧 VERIFICAÇÃO E CRIAÇÃO DE TABELAS DO BANCO DE DADOS")
    print("=" * 70)
    print()
    
    if not test_connection():
        print("❌ Não foi possível conectar ao banco de dados!")
        sys.exit(1)
    
    print()
    
    # Criar/verificar tabelas
    if create_all_tables():
        # Verificar estrutura
        structure_ok = verify_table_structure()
        
        # Verificar foreign keys
        verify_foreign_keys()
        
        print()
        print("=" * 70)
        if structure_ok:
            print("✅ Verificação concluída com sucesso!")
        else:
            print("⚠️  Verificação concluída com avisos. Verifique os problemas acima.")
        print("=" * 70)
    else:
        print()
        print("=" * 70)
        print("❌ Erro ao criar tabelas!")
        print("=" * 70)
        sys.exit(1)

