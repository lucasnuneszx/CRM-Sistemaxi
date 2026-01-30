#!/usr/bin/env python3
"""
Script para inicializar banco de dados no Railway
Executa automaticamente na primeira inicialização
"""
import os
import sys
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import test_connection, create_tables, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User

def init_railway_database():
    """Initialize database on Railway"""
    print("🚀 Inicializando banco de dados no Railway...")
    
    # Test connection
    if not test_connection():
        print("❌ Erro na conexão com banco!")
        return False
    
    # Create tables
    print("📊 Criando tabelas...")
    create_tables()
    print("✅ Tabelas criadas/verificadas com sucesso!")
    
    # Create admin user if not exists
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(
            (User.email == "admin@sistemaxi.com") | (User.email == "admin@admin.com")
        ).first()
        
        if not admin_user:
            admin_user = User(
                name="Admin",
                username="admin",
                email="admin@sistemaxi.com",
                hashed_password=get_password_hash("admin1234"),
                is_active=True,
                is_admin=True
            )
            db.add(admin_user)
            db.commit()
            print("✅ Usuário admin criado: admin@sistemaxi.com / admin1234")
        else:
            print("ℹ️  Usuário admin já existe")
    except Exception as e:
        print(f"⚠️  Erro ao criar usuário admin: {e}")
        db.rollback()
    finally:
        db.close()
    
    print("🎉 Banco de dados inicializado com sucesso!")
    return True

if __name__ == "__main__":
    init_railway_database()

