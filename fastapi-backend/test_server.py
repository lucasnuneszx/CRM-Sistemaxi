#!/usr/bin/env python3

import sys
import traceback

try:
    print("🔍 Testando importações...")
    
    from app.main import app
    print("✅ App importada com sucesso")
    
    import uvicorn
    print("✅ Uvicorn importado")
    
    print("🚀 Iniciando servidor...")
    uvicorn.run(app, host="0.0.0.0", port=3001, log_level="info")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    print("📋 Traceback completo:")
    traceback.print_exc()
    sys.exit(1) 