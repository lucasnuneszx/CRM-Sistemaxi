#!/bin/bash

# Script para enviar projeto para GitHub
# Execute: chmod +x enviar-github.sh && ./enviar-github.sh

set -e

# Obter diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR"

echo "🚀 Enviando projeto para GitHub..."
echo "📂 Diretório: $PROJECT_DIR"
echo ""

cd "$PROJECT_DIR" || exit 1

# Inicializar Git
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositório Git..."
    git init
fi

# Configurar remote
if git remote get-url origin > /dev/null 2>&1; then
    echo "🔄 Atualizando remote..."
    git remote set-url origin https://github.com/lucasnuneszx/CRM-Sistemaxi.git
else
    echo "➕ Adicionando remote..."
    git remote add origin https://github.com/lucasnuneszx/CRM-Sistemaxi.git
fi

# Criar .gitignore se não existir
if [ ! -f ".gitignore" ]; then
    echo "📝 Criando .gitignore..."
    cat > .gitignore << 'EOF'
node_modules/
__pycache__/
*.py[cod]
venv/
env/
.venv
.next/
out/
build/
*.db
*.log
.env
config.env
.DS_Store
uploads/
*.zip
EOF
fi

# Adicionar arquivos
echo "📝 Adicionando arquivos..."
git add .

# Commit
echo "💾 Fazendo commit..."
git commit -m "Initial commit: CRM Sistemaxi completo com configuração Railway

- Backend FastAPI configurado para Railway
- Frontend Next.js com TypeScript  
- Configuração de banco PostgreSQL
- Scripts de inicialização automática
- Documentação completa" || echo "⚠️  Nenhuma mudança para commitar"

# Branch main
echo "🌿 Configurando branch main..."
git branch -M main

# Push
echo "⬆️  Enviando para GitHub..."
echo ""
git push -u origin main

echo ""
echo "✅ Projeto enviado com sucesso!"
echo "🌐 Acesse: https://github.com/lucasnuneszx/CRM-Sistemaxi"

