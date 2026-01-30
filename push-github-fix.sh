#!/bin/bash

# Script que funciona mesmo com restrições de permissão
# Usa caminhos absolutos e evita dependências do diretório atual

PROJECT_DIR="/Users/L7/Downloads/squad-sistemaxi2"

echo "🚀 Enviando projeto para GitHub..."
echo "📂 Diretório: $PROJECT_DIR"
echo ""

# Verificar se o diretório existe
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Diretório não encontrado: $PROJECT_DIR"
    exit 1
fi

# Usar GIT_DIR e GIT_WORK_TREE para evitar problemas de permissão
export GIT_DIR="$PROJECT_DIR/.git"
export GIT_WORK_TREE="$PROJECT_DIR"

# Inicializar Git se não existir
if [ ! -d "$GIT_DIR" ]; then
    echo "📦 Inicializando repositório Git..."
    git --git-dir="$GIT_DIR" --work-tree="$PROJECT_DIR" init
fi

# Configurar remote
echo "🔗 Configurando remote..."
git --git-dir="$GIT_DIR" --work-tree="$PROJECT_DIR" remote remove origin 2>/dev/null || true
git --git-dir="$GIT_DIR" --work-tree="$PROJECT_DIR" remote add origin https://github.com/lucasnuneszx/CRM-Sistemaxi.git

# Criar .gitignore se não existir
if [ ! -f "$PROJECT_DIR/.gitignore" ]; then
    echo "📝 Criando .gitignore..."
    cat > "$PROJECT_DIR/.gitignore" << 'EOF'
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
*.sqlite
*.sqlite3
squad.db
sistemaxi.db
*.log
.env
.env.local
config.env
config.prod.env
.DS_Store
uploads/
*.zip
*.tsbuildinfo
EOF
fi

# Adicionar arquivos
echo "📝 Adicionando arquivos..."
git --git-dir="$GIT_DIR" --work-tree="$PROJECT_DIR" add .

# Commit
echo "💾 Fazendo commit..."
git --git-dir="$GIT_DIR" --work-tree="$PROJECT_DIR" commit -m "Initial commit: CRM Sistemaxi completo com configuração Railway" || echo "⚠️  Nenhuma mudança para commitar ou commit já existe"

# Branch main
echo "🌿 Configurando branch main..."
git --git-dir="$GIT_DIR" --work-tree="$PROJECT_DIR" branch -M main 2>/dev/null || git --git-dir="$GIT_DIR" --work-tree="$PROJECT_DIR" checkout -b main 2>/dev/null || true

# Push
echo "⬆️  Enviando para GitHub..."
echo ""
git --git-dir="$GIT_DIR" --work-tree="$PROJECT_DIR" push -u origin main

echo ""
echo "✅ Concluído!"
echo "🌐 Acesse: https://github.com/lucasnuneszx/CRM-Sistemaxi"

