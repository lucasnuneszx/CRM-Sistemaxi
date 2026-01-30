#!/bin/bash

echo "🚀 Instalando dependências do projeto Squad Sistemaxi..."
echo ""

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend (Next.js)..."
if [ -f "package.json" ]; then
    npm install
    echo "✅ Dependências do frontend instaladas!"
else
    echo "⚠️  package.json não encontrado!"
fi

echo ""

# Instalar dependências do backend
echo "🐍 Instalando dependências do backend (Python)..."
cd fastapi-backend

if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual Python..."
    python3 -m venv venv
fi

echo "🔄 Ativando ambiente virtual..."
source venv/bin/activate

echo "📦 Instalando dependências Python..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Dependências do backend instaladas!"
echo ""

cd ..

echo "🎉 Instalação concluída!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure o banco de dados em fastapi-backend/config.env"
echo "2. Execute: cd fastapi-backend && source venv/bin/activate && python init_db.py"
echo "3. Para rodar o backend: cd fastapi-backend && source venv/bin/activate && python run.py"
echo "4. Para rodar o frontend: npm run dev"

