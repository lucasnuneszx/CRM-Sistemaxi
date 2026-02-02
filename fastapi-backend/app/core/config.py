from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List
from pydantic import Field
import os


class Settings(BaseSettings):
    """Application settings"""
    
    model_config = SettingsConfigDict(
        env_file=os.getenv("ENV_FILE", "config.env"),
        case_sensitive=False,
        env_ignore_empty=True,
        env_file_encoding='utf-8',
        # Priorizar variáveis de ambiente sobre arquivo .env
        extra='ignore',
    )
    
    # Database
    database_url: str = Field(default="sqlite:///./squad.db", alias="DATABASE_URL")
    
    # JWT
    jwt_secret_key: str = Field(default="your-super-secret-jwt-key", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(default=1440, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Environment
    environment: str = Field(default="development", alias="ENVIRONMENT")
    
    # API
    api_v1_str: str = "/api/v1"
    project_name: str = "Squad API"
    project_version: str = "1.0.0"
    
    # CORS
    backend_cors_origins: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    # MinIO Settings
    minio_endpoint: str = Field(default="s3api.sellhuub.com", alias="MINIO_ENDPOINT")
    minio_access_key: str = Field(default="3kmZMXrzfPmzwxTxuHwQ", alias="MINIO_ACCESS_KEY")
    minio_secret_key: str = Field(default="NFVv61Z0ZhKXbRhZSIPHo1wZa9FEcvFGZsUsPCsn", alias="MINIO_SECRET_KEY")
    minio_bucket_name: str = Field(default="squad", alias="MINIO_BUCKET_NAME")
    minio_use_ssl: bool = Field(default=True, alias="MINIO_USE_SSL")


# Create global settings instance
settings = Settings()

# FORÇAR leitura de DATABASE_URL do ambiente (Railway tem prioridade)
env_database_url = os.getenv("DATABASE_URL")
if env_database_url:
    # Limpar '=' no início se existir
    if env_database_url.startswith('='):
        env_database_url = env_database_url[1:].strip()
    # Forçar uso da variável de ambiente
    settings.database_url = env_database_url
    print(f"🔧 DATABASE_URL lida do ambiente: {env_database_url[:30]}...")
else:
    print(f"⚠️  DATABASE_URL não encontrada no ambiente, usando: {settings.database_url}")

# Limpar DATABASE_URL se tiver '=' no início (correção para Railway)
if settings.database_url and settings.database_url.startswith('='):
    settings.database_url = settings.database_url[1:].strip() 