from app.core.database import engine
from sqlalchemy import text

def add_name_column():
    with engine.connect() as conn:
        try:
            # Add name column
            conn.execute(text('ALTER TABLE users ADD COLUMN name TEXT'))
            conn.commit()
            print('✅ Coluna name adicionada!')
            
            # Copy username to name for existing users
            conn.execute(text('UPDATE users SET name = username WHERE name IS NULL'))
            conn.commit()
            print('✅ Dados migrados de username para name!')
            
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print('ℹ️  Coluna name já existe')
            else:
                print(f'❌ Erro: {e}')

if __name__ == "__main__":
    add_name_column() 