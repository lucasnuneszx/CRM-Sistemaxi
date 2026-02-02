# 📋 Como Copiar DATABASE_URL do PostgreSQL no Railway

## ✅ Sim! A DATABASE_URL é a mesma do banco PostgreSQL

A `DATABASE_URL` é a **string de conexão completa** do seu banco PostgreSQL no Railway.

## 🔍 Onde Encontrar no Railway:

### Opção 1: Na Aba "Variables" do PostgreSQL
1. **Clique no serviço PostgreSQL** no seu projeto Railway
2. Vá na aba **"Variables"**
3. Procure por uma destas variáveis:
   - `DATABASE_URL` ✅ (se existir, use esta!)
   - `DATABASE_PRIVATE_URL`
   - `PGDATABASE_URL`
   - `POSTGRES_URL`

### Opção 2: Na Aba "Connect" do PostgreSQL
1. **Clique no serviço PostgreSQL**
2. Vá na aba **"Connect"** ou **"Data"**
3. Procure por **"Connection String"** ou **"Postgres Connection URL"**
4. Copie a URL completa

### Opção 3: Montar Manualmente (se não encontrar)
Se não encontrar a URL pronta, monte usando as variáveis:

1. No serviço PostgreSQL → **"Variables"**, copie:
   - `PGUSER` (geralmente é "postgres")
   - `POSTGRES_PASSWORD` (a senha)
   - `PGDATABASE` (nome do banco, geralmente "railway")
   - `RAILWAY_PRIVATE_DOMAIN` (o host)
   - `RAILWAY_TCP_PROXY_PORT` ou `PGPORT` (a porta)

2. Monte a URL assim:
   ```
   postgresql://{PGUSER}:{POSTGRES_PASSWORD}@{RAILWAY_PRIVATE_DOMAIN}:{RAILWAY_TCP_PROXY_PORT}/{PGDATABASE}
   ```

   **Exemplo:**
   ```
   postgresql://postgres:abc123xyz@mainline.proxy.rlwy.net:32921/railway
   ```

## 📝 Depois de Copiar:

1. **Vá no serviço FastAPI** (não o PostgreSQL!)
2. **Variables** → **"+ New Variable"**
3. **Nome:** `DATABASE_URL`
4. **Valor:** Cole a URL que você copiou
5. **Salve**

## ⚠️ Importante:

- A URL deve começar com `postgresql://` (não `postgres://`)
- Não deve ter espaços no início ou fim
- Não deve ter `=` no início
- A variável deve estar no **SERVIÇO FASTAPI**, não no PostgreSQL

## ✅ Formato Correto:

```
postgresql://usuario:senha@host:porta/database
```

**Exemplo real:**
```
postgresql://postgres:FiwxElRrALRkCtrPWzkmGfiwXzKbgviJ@mainline.proxy.rlwy.net:32921/railway
```

