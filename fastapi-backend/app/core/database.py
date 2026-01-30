from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
import os

# Limpar DATABASE_URL se necessário
database_url = settings.database_url.strip()
# Remover '=' no início se existir (erro comum no Railway)
if database_url.startswith('='):
    database_url = database_url[1:].strip()

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