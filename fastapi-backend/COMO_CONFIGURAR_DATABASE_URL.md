# 🔧 Como Configurar DATABASE_URL no Railway

## ❌ Problema Atual:
```
❌ DATABASE_URL: NÃO ENCONTRADA!
```

## ✅ Solução - Passo a Passo:

### 1. Abra o Railway Dashboard
- Acesse: https://railway.app
- Entre no seu projeto

### 2. Encontre o Serviço PostgreSQL
- No painel do projeto, procure pelo serviço do **PostgreSQL**
- Clique nele

### 3. Copie a DATABASE_URL
- Vá em **"Variables"** ou **"Data"** → **"Connect"**
- Procure por uma destas variáveis:
  - `DATABASE_URL` (preferencial)
  - `DATABASE_PRIVATE_URL`
  - `PGDATABASE_URL`
  - Ou monte manualmente: `postgresql://postgres:SENHA@HOST:PORTA/DATABASE`

### 4. Configure no Serviço FastAPI
- Volte para o serviço do **FastAPI** (não o PostgreSQL)
- Vá em **"Variables"**
- Clique em **"+ New Variable"**
- Nome: `DATABASE_URL`
- Valor: Cole a URL que você copiou
- Clique em **"Add"**

### 5. Formato Correto da URL:
```
postgresql://postgres:SENHA@HOST:PORTA/DATABASE
```

**Exemplo:**
```
postgresql://postgres:abc123@mainline.proxy.rlwy.net:32921/railway
```

### 6. Redeploy
- Após adicionar a variável, o Railway fará redeploy automaticamente
- Aguarde 2-3 minutos
- Verifique os logs novamente

## ✅ Verificação nos Logs:

Após configurar, você deve ver:
```
✅ DATABASE_URL: postgresql://postgres:***@...
   Tipo: PostgreSQL
```

## 🆘 Se não encontrar a variável no PostgreSQL:

1. **Crie manualmente:**
   - No serviço PostgreSQL, vá em **"Variables"**
   - Procure por:
     - `PGUSER` (usuário, geralmente "postgres")
     - `POSTGRES_PASSWORD` (senha)
     - `PGDATABASE` (nome do banco)
     - `RAILWAY_PRIVATE_DOMAIN` ou `RAILWAY_TCP_PROXY_DOMAIN` (host)
     - `RAILWAY_TCP_PROXY_PORT` ou `PGPORT` (porta)

2. **Monte a URL:**
   ```
   postgresql://{PGUSER}:{POSTGRES_PASSWORD}@{RAILWAY_PRIVATE_DOMAIN}:{RAILWAY_TCP_PROXY_PORT}/{PGDATABASE}
   ```

3. **Ou use a URL pública:**
   ```
   postgresql://{PGUSER}:{POSTGRES_PASSWORD}@{RAILWAY_TCP_PROXY_DOMAIN}:{RAILWAY_TCP_PROXY_PORT}/{PGDATABASE}
   ```

## 📝 Nota Importante:

- A variável `DATABASE_URL` deve estar no **SERVIÇO DO FASTAPI**, não no PostgreSQL
- O Railway pode fazer referência automática, mas é melhor configurar explicitamente
- Não use espaços ou caracteres especiais no início/fim da URL

