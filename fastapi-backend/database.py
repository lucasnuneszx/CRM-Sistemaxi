from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment file (default: config.env, production: config.prod.env)
env_file = os.getenv("ENV_FILE", "config.env")
load_dotenv(env_file)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./squad.db")

# Configure engine based on database type
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # PostgreSQL configuration
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Test database connection
def test_connection():
    try:
        engine.connect()
        print(f"✅ Conexão com banco de dados bem-sucedida!")
        if '@' in DATABASE_URL:
            masked_url = DATABASE_URL.split('@')[0] + "@***"
        else:
            masked_url = DATABASE_URL
        print(f"📍 Database URL: {masked_url}")
        return True
    except Exception as e:
        print(f"❌ Erro de conexão com banco: {e}")
        return False 