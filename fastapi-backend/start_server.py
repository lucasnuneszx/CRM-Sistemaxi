#!/usr/bin/env python3
"""
Script para iniciar o servidor FastAPI no Railway
Lê a variável PORT do ambiente e inicia o servidor
"""
import os
import uvicorn

if __name__ == "__main__":
    # Obter porta do ambiente ou usar padrão
    port = int(os.getenv("PORT", "3001"))
    
    print(f"🚀 Iniciando FastAPI na porta {port}...")
    print(f"📡 API será executada em: http://0.0.0.0:{port}")
    print(f"📚 Documentação em: http://0.0.0.0:{port}/docs")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )

