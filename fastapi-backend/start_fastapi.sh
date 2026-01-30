#!/bin/bash

echo "🔄 Iniciando FastAPI Squad Backend..."

# Matar qualquer processo na porta 3001
echo "🧹 Limpando porta 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Matar processos Node.js específicos do backend
echo "🧹 Matando processos Node.js do backend..."
pkill -f "ts-node src/index.ts" 2>/dev/null || true
pkill -f "nodemon.*ts-node" 2>/dev/null || true

# Aguardar um pouco
sleep 2

# Ativar ambiente virtual
echo "🐍 Ativando ambiente virtual..."
source venv/bin/activate

# Verificar se a porta está livre
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Porta 3001 ainda está em uso!"
    echo "Processos na porta 3001:"
    lsof -i :3001
    exit 1
fi

echo "✅ Porta 3001 livre!"

# Carregar variáveis de ambiente do config.env
echo "🔑 Carregando variáveis de ambiente do config.env..."
if [ -f config.env ]; then
    export $(grep -v '^#' config.env | xargs)
    echo "✅ Variáveis de ambiente carregadas."
else
    echo "⚠️  Arquivo config.env não encontrado! Continuando sem variáveis extras."
fi

# Iniciar FastAPI
echo "🚀 Iniciando FastAPI..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload 