from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
import os

# FORÇAR leitura de DATABASE_URL do ambiente se existir (Railway)
env_db_url = os.getenv("DATABASE_URL")
if env_db_url:
    # Limpar '=' no início se existir
    if env_db_url.startswith('='):
        env_db_url = env_db_url[1:].strip()
    database_url = env_db_url
    print(f"🔧 database.py: Usando DATABASE_URL do ambiente")
else:
    # Usar do settings
    database_url = settings.database_url.strip()
    # Remover '=' no início se existir (erro comum no Railway)
    if database_url.startswith('='):
        database_url = database_url[1:].strip()
    print(f"🔧 database.py: Usando DATABASE_URL do settings")

# Create database engine
if database_url.startswith("sqlite"):
    engine = create_engine(
        database_url, 
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL configuration
    engine = create_engine(
        database_url, 
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_connection() -> bool:
    """Test database connection"""
    try:
        with engine.connect() as connection:
            print("✅ Conexão com banco de dados bem-sucedida!")
            if '@' in settings.database_url:
                masked_url = settings.database_url.split('@')[0] + "@***"
            else:
                masked_url = settings.database_url
            print(f"📍 Database URL: {masked_url}")
            return True
    except Exception as e:
        print(f"❌ Erro de conexão com banco: {e}")
        return False


def create_tables():
    """Create all tables"""
    Base.metadata.create_all(bind=engine) 