#!/bin/bash

echo "🔧 Configurando repositório Git..."

# Verificar se já é um repositório Git
if [ -d ".git" ]; then
    echo "⚠️  Já existe um repositório Git. Removendo..."
    rm -rf .git
fi

# Inicializar novo repositório
echo "📦 Inicializando novo repositório Git..."
git init

# Criar .gitignore se não existir
if [ ! -f ".gitignore" ]; then
    echo "📝 Criando .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
.venv

# Next.js
.next/
out/
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
config.env
config.prod.env

# Database
*.db
*.sqlite
*.sqlite3
squad.db
sistemaxi.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
fastapi.log
server.log

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Uploads
uploads/
*.zip

# TypeScript
*.tsbuildinfo

# Testing
coverage/
.nyc_output/

# Misc
*.pem
*.key
.cache/
EOF
fi

# Fazer commit inicial
echo "📝 Fazendo commit inicial..."
git add .
git commit -m "Initial commit: Squad Sistemaxi project setup"

echo "✅ Repositório Git configurado com sucesso!"
echo ""
echo "📝 Para adicionar um repositório remoto, execute:"
echo "   git remote add origin <URL_DO_REPOSITORIO>"
echo "   git push -u origin main"

