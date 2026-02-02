#!/usr/bin/env python3
"""
Script para iniciar o servidor FastAPI no Railway
Lê a variável PORT do ambiente e inicia o servidor
"""
import os
import uvicorn

if __name__ == "__main__":
    # Debug: mostrar variáveis importantes
    print("=" * 60)
    print("🔍 VARIÁVEIS DE AMBIENTE NO STARTUP")
    print("=" * 60)
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        masked = db_url.split('@')[0] + "@***" if '@' in db_url else db_url[:50]
        print(f"✅ DATABASE_URL: {masked}...")
        print(f"   Tipo: {'PostgreSQL' if 'postgresql' in db_url.lower() else 'SQLite'}")
    else:
        print("❌ DATABASE_URL: NÃO ENCONTRADA!")
    print(f"📍 PORT: {os.getenv('PORT', '3001')}")
    print(f"🌍 ENVIRONMENT: {os.getenv('ENVIRONMENT', 'development')}")
    print("=" * 60)
    
    # Obter porta do ambiente ou usar padrão
    port = int(os.getenv("PORT", "3001"))
    
    print(f"\n🚀 Iniciando FastAPI na porta {port}...")
    print(f"📡 API será executada em: http://0.0.0.0:{port}")
    print(f"📚 Documentação em: http://0.0.0.0:{port}/docs")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )

