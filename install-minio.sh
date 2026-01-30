#!/bin/bash

echo "Instalando dependências para MinIO..."

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

# Instalar dependências do MinIO
echo "Instalando cliente MinIO e dependências..."
npm install --save minio
npm install --save xml fast-xml-parser
npm install --save-dev @types/minio

# Verificar instalação
echo "Verificando instalação..."
node -e "const Minio = require('minio'); console.log('MinIO está instalado com sucesso!');"

echo "Testando configuração do .env..."
node -e "require('dotenv').config(); console.log('S3_ENDPOINT:', process.env.S3_ENDPOINT);"

echo "Instalação concluída com sucesso!"
echo "Próximos passos:"
echo "1. Verifique as credenciais no arquivo .env"
echo "2. Execute 'node test-minio.js' para testar a conexão"
echo "3. Reinicie o servidor com './run-server.sh'" 