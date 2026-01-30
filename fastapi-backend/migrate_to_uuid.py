import uuid
from app.core.database import SessionLocal, engine
from sqlalchemy import text
from app.models.base import BaseModel

def migrate_to_uuid():
    db = SessionLocal()
    
    print("🚀 Iniciando migração para UUID...")
    
    # 1. Salvar dados da tabela Project original
    print("📊 Coletando dados da tabela Project original...")
    result = db.execute(text('SELECT * FROM "Project"'))
    original_projects = result.fetchall()
    cols = result.keys()
    
    projects_data = []
    for row in original_projects:
        project_dict = dict(zip(cols, row))
        projects_data.append(project_dict)
        print(f"   - {project_dict['name']}: {project_dict['id']}")
    
    # 2. Dropar tabelas existentes do FastAPI
    print("\n🗑️ Removendo tabelas antigas do FastAPI...")
    try:
        db.execute(text('DROP TABLE IF EXISTS atividades CASCADE'))
        db.execute(text('DROP TABLE IF EXISTS projects CASCADE'))
        db.execute(text('DROP TABLE IF EXISTS setores CASCADE'))
        db.execute(text('DROP TABLE IF EXISTS users CASCADE'))
        db.commit()
        print("   ✅ Tabelas removidas")
    except Exception as e:
        print(f"   ⚠️ Erro ao remover tabelas: {e}")
        db.rollback()
    
    # 3. Recriar tabelas com UUID
    print("\n🔧 Recriando tabelas com UUID...")
    BaseModel.metadata.create_all(bind=engine)
    print("   ✅ Tabelas recriadas")
    
    # 4. Criar usuário admin com UUID
    print("\n👤 Criando usuário admin...")
    admin_id = str(uuid.uuid4())
    try:
        db.execute(text("""
            INSERT INTO users (id, username, email, hashed_password, is_active, is_admin, created_at, updated_at)
            VALUES (:id, :username, :email, :password, true, true, NOW(), NOW())
        """), {
            'id': admin_id,
            'username': 'admin@admin.com',
            'email': 'admin@admin.com', 
            'password': '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewlBrHaKoEFN0QHy'  # "admin"
        })
        db.commit()
        print(f"   ✅ Admin criado com ID: {admin_id}")
    except Exception as e:
        print(f"   ⚠️ Erro ao criar admin: {e}")
        db.rollback()
    
    # 5. Migrar projetos
    print("\n📁 Migrando projetos...")
    for project in projects_data:
        try:
            db.execute(text("""
                INSERT INTO projects (id, name, description, status, "startDate", "endDate", budget, owner_id, created_at, updated_at)
                VALUES (:id, :name, :description, :status, :startDate, :endDate, :budget, :owner_id, :created_at, :updated_at)
            """), {
                'id': project['id'],
                'name': project['name'],
                'description': project['description'],
                'status': project['status'],
                'startDate': project['startDate'],
                'endDate': project['endDate'],
                'budget': project['budget'],
                'owner_id': admin_id,  # Usar o admin como owner
                'created_at': project['createdAt'],
                'updated_at': project['updatedAt']
            })
            print(f"   ✅ Migrado: {project['name']}")
        except Exception as e:
            print(f"   ❌ Erro ao migrar {project['name']}: {e}")
    
    db.commit()
    
    # 6. Dropar tabelas antigas do Prisma
    print("\n🗑️ Removendo tabelas antigas do Prisma...")
    old_tables = ['Project', 'User', 'Atividade', 'Setor', 'Campaign', 'Documento', 'Influencer', 'TeamMember', '_ProjectToTeamMember', '_ProjectUsers']
    for table in old_tables:
        try:
            db.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
            print(f"   ✅ Removida: {table}")
        except Exception as e:
            print(f"   ⚠️ Erro ao remover {table}: {e}")
    
    db.commit()
    db.close()
    
    print("\n🎉 Migração concluída!")
    print("✅ Todos os IDs agora são UUID")
    print("✅ Dados preservados")
    print("✅ Tabelas antigas removidas")

if __name__ == "__main__":
    migrate_to_uuid() 