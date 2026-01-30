#!/bin/bash

echo "🚀 Enviando projeto para o repositório GitHub..."
echo ""

# Diretório do projeto
PROJECT_DIR="/Users/L7/Downloads/squad-sistemaxi2"

cd "$PROJECT_DIR" || exit 1

# Verificar se já é um repositório Git
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositório Git..."
    git init
fi

# Verificar se o remote já existe
if git remote get-url origin > /dev/null 2>&1; then
    echo "🔄 Atualizando remote origin..."
    git remote set-url origin https://github.com/lucasnuneszx/CRM-Sistemaxi.git
else
    echo "➕ Adicionando remote origin..."
    git remote add origin https://github.com/lucasnuneszx/CRM-Sistemaxi.git
fi

# Adicionar todos os arquivos
echo "📝 Adicionando arquivos ao Git..."
git add .

# Fazer commit
echo "💾 Fazendo commit..."
git commit -m "Initial commit: CRM Sistemaxi completo com configuração Railway

- Backend FastAPI configurado para Railway
- Frontend Next.js com TypeScript
- Configuração de banco de dados PostgreSQL
- Scripts de inicialização automática
- Documentação completa de deploy"

# Definir branch main
echo "🌿 Configurando branch main..."
git branch -M main

# Fazer push
echo "⬆️  Enviando para GitHub..."
echo ""
echo "⚠️  Você precisará autenticar com suas credenciais do GitHub"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Projeto enviado com sucesso para https://github.com/lucasnuneszx/CRM-Sistemaxi"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Acesse https://railway.app"
    echo "2. Crie um novo projeto"
    echo "3. Conecte com o repositório GitHub"
    echo "4. Adicione um banco PostgreSQL"
    echo "5. Configure as variáveis de ambiente"
    echo ""
    echo "📚 Veja RAILWAY_DEPLOY.md para instruções detalhadas"
else
    echo ""
    echo "❌ Erro ao enviar para GitHub"
    echo "Verifique suas credenciais e tente novamente"
    echo ""
    echo "💡 Dica: Se usar autenticação por token, configure:"
    echo "   git remote set-url origin https://SEU_TOKEN@github.com/lucasnuneszx/CRM-Sistemaxi.git"
fi

