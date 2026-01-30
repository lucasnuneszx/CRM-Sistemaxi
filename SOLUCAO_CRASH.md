# 🆘 Solução: Aplicação CRASHED no Railway

## 🔍 Passo 1: Verificar os Logs

No Railway:
1. Clique no deploy que está "CRASHED"
2. Clique em **"View Logs"** ou **"Logs"**
3. Procure por erros no final dos logs

## 🐛 Problemas Comuns e Soluções

### Erro 1: "ModuleNotFoundError" ou "ImportError"

**Causa:** Dependências não instaladas ou caminho incorreto

**Solução:**
1. Verifique se o **Root Directory** está configurado como `fastapi-backend`
2. Settings → Root Directory → `fastapi-backend`

### Erro 2: "Unable to connect to database"

**Causa:** `DATABASE_URL` não configurada

**Solução:**
1. Variables → New Variable → Add Reference
2. Selecione PostgreSQL → `DATABASE_URL`

### Erro 3: "Port already in use" ou "Address already in use"

**Causa:** Comando de start incorreto

**Solução:** O Railway usa `$PORT` automaticamente. Verifique o Procfile:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Erro 4: "No module named 'app'"

**Causa:** Root Directory não configurado

**Solução:**
1. Settings → Root Directory → `fastapi-backend`
2. Faça redeploy

### Erro 5: "Failed to build" ou erro no build

**Causa:** Problemas com dependências Python

**Solução:**
1. Verifique se `requirements.txt` está em `fastapi-backend/`
2. Verifique se todas as dependências estão listadas

## ✅ Checklist de Verificação

- [ ] **Root Directory** configurado como `fastapi-backend`
- [ ] **DATABASE_URL** configurada via Add Reference
- [ ] **JWT_SECRET_KEY** configurada
- [ ] **ENVIRONMENT** = `production`
- [ ] **Procfile** existe em `fastapi-backend/`
- [ ] **requirements.txt** existe em `fastapi-backend/`

## 🔧 Solução Rápida

### 1. Verificar Root Directory

No Railway:
- Settings → Root Directory → Deve ser: `fastapi-backend`

### 2. Verificar Variáveis

Variables deve ter:
- `DATABASE_URL` (via Reference)
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM` = `HS256`
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` = `1440`
- `ENVIRONMENT` = `production`

### 3. Fazer Redeploy

1. Deployments → Clique nos 3 pontos no deploy crashed
2. Selecione **"Redeploy"**

## 📋 Comandos para Verificar Localmente

Se quiser testar localmente antes:

```bash
cd fastapi-backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 3001
```

## 🆘 Se Nada Funcionar

1. **Copie os logs completos** do Railway
2. **Verifique:**
   - Root Directory está correto?
   - Todas as variáveis estão configuradas?
   - O código foi commitado e pushado?

## 📝 Próximos Passos

Após corrigir:
1. Aguarde o redeploy
2. Verifique os logs novamente
3. Acesse: `https://sistemaxi.up.railway.app/health`
4. Se funcionar, acesse: `https://sistemaxi.up.railway.app/api/init-database`

