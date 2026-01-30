# 🆘 Solução: Erro 502 Bad Gateway

## 🔍 O que significa 502?

Erro 502 significa que a aplicação **não está conseguindo iniciar** ou está **crashando imediatamente**.

## 📋 Checklist de Verificação

### 1. Ver Logs Reais do Railway

**IMPORTANTE:** Os logs que você viu são apenas requisições HTTP. Precisamos ver os **logs de build/startup**:

1. No Railway, vá em **"Deployments"**
2. Clique no deploy que está crashed
3. Clique em **"View Logs"** ou **"Logs"**
4. Procure por erros em **vermelho** ou mensagens de erro

### 2. Verificações Essenciais

#### ✅ Root Directory
- Settings → Root Directory → Deve ser: `fastapi-backend`
- **Se não estiver, configure e salve!**

#### ✅ Variáveis de Ambiente
- Variables → Verifique se tem:
  - `DATABASE_URL` (via Add Reference)
  - `JWT_SECRET_KEY`
  - `ENVIRONMENT=production`

#### ✅ Arquivos Necessários
Verifique se estes arquivos existem em `fastapi-backend/`:
- `Procfile`
- `requirements.txt`
- `app/main.py`

## 🐛 Erros Comuns e Soluções

### Erro: "ModuleNotFoundError: No module named 'app'"

**Causa:** Root Directory não configurado

**Solução:**
```
Settings → Root Directory → fastapi-backend
```

### Erro: "ImportError" ou "cannot import"

**Causa:** Dependências faltando ou caminho incorreto

**Solução:**
1. Verifique Root Directory
2. Verifique se `requirements.txt` está em `fastapi-backend/`

### Erro: "Unable to connect to database"

**Causa:** DATABASE_URL não configurada

**Solução:**
1. Variables → Add Reference
2. Selecione PostgreSQL → DATABASE_URL

### Erro: "Port already in use"

**Causa:** Comando de start incorreto

**Solução:** Já está correto no Procfile. Verifique se está usando `$PORT`.

## 🔧 Solução Rápida

### Passo 1: Verificar Root Directory

```
Settings → Root Directory → fastapi-backend
```

### Passo 2: Verificar Variáveis

```
Variables:
- DATABASE_URL (via Reference)
- JWT_SECRET_KEY
- JWT_ALGORITHM = HS256
- JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 1440
- ENVIRONMENT = production
```

### Passo 3: Fazer Redeploy

1. Deployments → 3 pontos → Redeploy
2. Aguarde o build completar
3. Verifique os logs novamente

## 📝 O que fazer AGORA

1. **Copie os logs COMPLETOS** do Railway (não apenas as requisições HTTP)
2. **Verifique Root Directory** → Deve ser `fastapi-backend`
3. **Me envie os logs** para eu identificar o erro exato

## ⚠️ Importante

Os logs que você mostrou são apenas **requisições HTTP** (GET /). Precisamos ver os **logs de build/startup** que mostram o erro real.

Para ver os logs corretos:
- Railway → Deployments → Clique no deploy → View Logs
- Procure por mensagens de erro em vermelho ou traceback Python

