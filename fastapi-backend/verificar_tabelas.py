#!/usr/bin/env python3
"""
Script para verificar se todas as tabelas foram criadas no banco de dados
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import engine, test_connection
from sqlalchemy import inspect, text
from app.models import (
    User, Project, Atividade, Setor, Documento, CasaParceira,
    RelatorioDiario, CredencialAcesso, MetricasRedesSociais,
    Criativo, UserProject, Lead, KanbanColumn, Cliente, Proposta,
    FinanceTransaction, Notificacao
)

def verificar_tabelas():
    """Verifica se todas as tabelas foram criadas"""
    print("🔍 Verificando tabelas no banco de dados...")
    print()
    
    if not test_connection():
        print("❌ Erro na conexão com banco!")
        return False
    
    # Lista de todas as tabelas que devem existir
    tabelas_esperadas = {
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
        'notificacoes': 'Notificações',
    }
    
    inspector = inspect(engine)
    tabelas_existentes = inspector.get_table_names()
    
    print(f"📊 Total de tabelas encontradas: {len(tabelas_existentes)}")
    print()
    
    todas_ok = True
    for tabela, descricao in tabelas_esperadas.items():
        if tabela in tabelas_existentes:
            print(f"✅ {tabela:30} ({descricao})")
        else:
            print(f"❌ {tabela:30} ({descricao}) - FALTANDO")
            todas_ok = False
    
    print()
    
    if todas_ok:
        print("🎉 Todas as tabelas foram criadas com sucesso!")
        
        # Verificar se há usuário admin
        from app.core.database import SessionLocal
        from app.models.user import User
        
        db = SessionLocal()
        try:
            admin = db.query(User).filter(
                (User.email == "admin@sistemaxi.com") | (User.email == "admin@admin.com")
            ).first()
            
            if admin:
                print(f"✅ Usuário admin encontrado: {admin.email}")
            else:
                print("⚠️  Usuário admin não encontrado")
        finally:
            db.close()
    else:
        print("⚠️  Algumas tabelas estão faltando!")
        print("💡 Execute: python railway_init.py")
    
    return todas_ok

if __name__ == "__main__":
    verificar_tabelas()

