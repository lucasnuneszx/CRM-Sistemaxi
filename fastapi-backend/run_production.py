#!/usr/bin/env python3
import uvicorn
import os

if __name__ == "__main__":
    print("🚀 Iniciando FastAPI Server - PRODUÇÃO...")
    print("📡 API será executada em: http://localhost:3001")
    print("📚 Documentação em: http://localhost:3001/docs")
    print("🔧 Para parar o servidor: Ctrl+C")
    print("🗄️ Usando PostgreSQL de PRODUÇÃO")
    print("-" * 50)
    
    # Use config.prod.env for production
    os.environ["ENV_FILE"] = "config.prod.env"
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3001,
        reload=False,  # Disable auto-reload in production
        log_level="info"
    ) 