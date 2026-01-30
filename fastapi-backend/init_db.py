#!/usr/bin/env python3
"""
Script para inicializar o banco de dados
"""
from app.core.database import test_connection, create_tables
from app.core.security import get_password_hash
from app.core.database import SessionLocal
from app.models.user import User

def init_database():
    """Initialize database with tables and admin user"""
    print("🔧 Inicializando banco de dados...")
    
    # Test connection
    if not test_connection():
        print("❌ Erro na conexão com banco!")
        return False
    
    # Create tables
    create_tables()
    print("✅ Tabelas criadas com sucesso!")
    
    # Create admin user if not exists
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "admin@admin.com").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@admin.com",
                hashed_password=get_password_hash("admin"),
                is_active=True,
                is_admin=True
            )
            db.add(admin_user)
            db.commit()
            print("✅ Usuário admin criado: admin@admin.com / admin")
        else:
            print("ℹ️  Usuário admin já existe")
    except Exception as e:
        print(f"❌ Erro ao criar usuário admin: {e}")
        db.rollback()
    finally:
        db.close()
    
    print("🎉 Banco de dados inicializado com sucesso!")
    return True

if __name__ == "__main__":
    init_database() 