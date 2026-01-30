# 🔧 Configuração de Variáveis no Railway

## ✅ Variáveis do Banco PostgreSQL (Já Criadas Automaticamente)

O Railway já criou estas variáveis no serviço PostgreSQL:

```
DATABASE_URL=postgresql://${{PGUSER}}:${{POSTGRES_PASSWORD}}@${{RAILWAY_PRIVATE_DOMAIN}}:5432/${{PGDATABASE}}
DATABASE_PUBLIC_URL=postgresql://${{PGUSER}}:${{POSTGRES_PASSWORD}}@${{RAILWAY_TCP_PROXY_DOMAIN}}:${{RAILWAY_TCP_PROXY_PORT}}/${{PGDATABASE}}
```

## 📋 Passo a Passo: Conectar Aplicação ao Banco

### 1. No Serviço da Aplicação (FastAPI)

1. Vá em **"Variables"**
2. Clique em **"New Variable"**
3. Selecione **"Add Reference"**
4. Escolha o serviço **PostgreSQL** que você criou
5. Selecione a variável: **`DATABASE_URL`**
6. Clique em **"Add"**

Isso criará uma referência automática que será resolvida pelo Railway.

### 2. Variáveis Adicionais Necessárias

Ainda em **"Variables"**, adicione manualmente:

```env
JWT_SECRET_KEY=seu-jwt-secret-key-super-seguro-aqui
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
ENVIRONMENT=production
```

**Para gerar um JWT_SECRET_KEY seguro:**
```bash
openssl rand -hex 32
```

### 3. Verificar Variáveis Finais

Após configurar, você deve ter:

✅ **Do PostgreSQL (via Reference):**
- `DATABASE_URL` (referência automática)

✅ **Manuais:**
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`
- `ENVIRONMENT`

## 🔍 Como Verificar se Está Funcionando

### 1. Verificar Logs do Deploy

Após o deploy, verifique os logs. Você deve ver:

```
🚀 Iniciando Sistemaxi API...
✅ Conexão com banco de dados bem-sucedida!
📍 Database URL: postgresql://***@***:***/***
📊 Tabelas do banco criadas/verificadas com sucesso!
✅ Usuário admin padrão criado (admin@sistemaxi.com / admin1234)
✅ API rodando em: https://seu-app.railway.app
```

### 2. Testar Endpoint de Health

Acesse: `https://seu-app.railway.app/health`

Deve retornar:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### 3. Testar Documentação

Acesse: `https://seu-app.railway.app/docs`

A documentação interativa do FastAPI deve aparecer.

## ⚠️ Importante

- **Use `DATABASE_URL`** (não `DATABASE_PUBLIC_URL`) - é a conexão privada mais segura
- O Railway resolve automaticamente as variáveis `${{...}}`
- Não precisa configurar `PGUSER`, `POSTGRES_PASSWORD`, etc. manualmente
- Apenas adicione a referência `DATABASE_URL` do serviço PostgreSQL

## 🆘 Troubleshooting

### Erro: "Unable to connect to database"

1. Verifique se a referência `DATABASE_URL` está configurada
2. Verifique se o serviço PostgreSQL está rodando
3. Verifique os logs do PostgreSQL

### Erro: "relation does not exist"

As tabelas serão criadas automaticamente no primeiro startup. Se não foram criadas:
- Verifique os logs do deploy
- Procure por: "📊 Tabelas do banco criadas/verificadas com sucesso!"

### Variável não encontrada

Certifique-se de usar **"Add Reference"** e não criar a variável manualmente. A referência permite que o Railway resolva automaticamente.

## ✅ Próximos Passos

Após configurar as variáveis:

1. ✅ O Railway fará redeploy automaticamente
2. ✅ Aguarde o deploy completar
3. ✅ Verifique os logs
4. ✅ Teste a API em `/docs`
5. ✅ Faça login com: `admin@sistemaxi.com` / `admin1234`

