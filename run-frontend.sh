#!/bin/bash

# Script para executar o frontend
echo "Iniciando a aplicação frontend..."

# Caminho para o Node.js
NODE_PATH="/opt/homebrew/Cellar/node@20/20.19.0_1/bin"

# Verificar se o diretório Node existe
if [ ! -d "$NODE_PATH" ]; then
    echo "Erro: Diretório Node.js não encontrado em $NODE_PATH"
    exit 1
fi

# Adicionar o caminho do Node ao PATH
export PATH="$NODE_PATH:$PATH"
echo "Node.js adicionado ao PATH: $NODE_PATH"

# Iniciar o servidor de desenvolvimento
echo "Iniciando o servidor Next.js..."
npm run dev 