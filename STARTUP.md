# 🚀 Sistema CRM - Guia de Inicialização

## ⚡ Quick Start

### Opção 1: Iniciar com Auto-Restart (Recomendado)

```bash
# No terminal 1 - Inicia os serviços
cd /Users/L7/crmsistemaxi/squad
./start.sh

# No terminal 2 - Inicia o monitor (em outra aba)
cd /Users/L7/crmsistemaxi/squad
chmod +x monitor.sh
./monitor.sh
```

### Opção 2: Iniciar Manualmente

```bash
# Terminal 1 - Backend
cd /Users/L7/crmsistemaxi/squad/fastapi-backend
source /Users/L7/crmsistemaxi/.venv/bin/activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 3001

# Terminal 2 - Frontend
cd /Users/L7/crmsistemaxi/squad
npm run dev
```

## 📍 Acessos

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **API Docs**: http://localhost:3001/docs
- **Funil de Vendas**: http://localhost:3000/recursos

## 🔑 Credenciais Padrão

- **Email**: admin@admin.com
- **Senha**: admin

## 🛠️ Troubleshooting

### Backend não inicia
```bash
# Liberar porta 3001
lsof -i :3001
kill -9 <PID>

# Ou usar o script de cleanup
pkill -9 -f "uvicorn"
```

### Frontend não inicia
```bash
# Limpar cache e dependências
rm -rf .next node_modules
npm install
npm run dev
```

### Ambos caem
1. Verifique o log de erro:
   ```bash
   tail -50 /tmp/backend.log
   tail -50 /tmp/frontend.log
   ```

2. Limpe os processos:
   ```bash
   pkill -9 -f "uvicorn"
   pkill -9 -f "npm run dev"
   sleep 2
   ```

3. Reinicie pelo `start.sh`

## 📊 Recursos Implementados

- ✅ Autenticação JWT
- ✅ Dashboard com gráficos
- ✅ Gerenciamento de Projetos
- ✅ Atividades e Tarefas
- ✅ **Funil de Vendas (Kanban)** - Novo!
  - Colunas arrastáveis
  - Cards de clientes/leads
  - Lista de clientes na esquerda
  - Drag-and-drop entre etapas

## 🔍 Logs

Os logs estão em:
- Backend: `/tmp/backend.log`
- Frontend: `/tmp/frontend.log`

Para acompanhar em tempo real:
```bash
tail -f /tmp/backend.log
tail -f /tmp/frontend.log
```

## 💡 Dicas

1. **Sempre use `start.sh` para iniciar**
2. **Mantenha o monitor rodando para auto-recovery**
3. **Verifique os logs antes de reportar bugs**
4. **Limpe o cache do navegador se tiver problemas de UI**
