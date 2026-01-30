# 🚂 Guia Rápido: Deploy no Railway

## ✅ Passo 1: Criar Banco PostgreSQL no Railway

1. No dashboard do Railway, clique em **"New"**
2. Selecione **"Database"** → **"Add PostgreSQL"**
3. O Railway criará automaticamente o banco
4. **Anote o nome do serviço** (ex: "Postgres")

## ✅ Passo 2: Criar Serviço da Aplicação

1. Clique em **"New"** novamente
2. Selecione **"GitHub Repo"**
3. Escolha o repositório: **`lucasnuneszx/CRM-Sistemaxi`**
4. O Railway começará a fazer deploy automaticamente

## ✅ Passo 3: Configurar Root Directory

1. No serviço da aplicação, vá em **"Settings"**
2. Role até **"Root Directory"**
3. Configure como: **`fastapi-backend`**
4. Clique em **"Save"**

## ✅ Passo 4: Conectar Banco de Dados

1. No serviço da aplicação, vá em **"Variables"**
2. Clique em **"New Variable"**
3. Selecione **"Add Reference"**
4. Escolha o serviço PostgreSQL que você criou
5. Selecione **`DATABASE_URL`**
6. O Railway adicionará automaticamente a variável

## ✅ Passo 5: Adicionar Variáveis de Ambiente

Ainda em **"Variables"**, adicione manualmente:

```env
JWT_SECRET_KEY=seu-jwt-secret-key-super-seguro-aqui-mude-este-valor
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
ENVIRONMENT=production
```

**Importante:** Gere um JWT_SECRET_KEY seguro! Você pode usar:
```bash
openssl rand -hex 32
```

## ✅ Passo 6: Verificar Deploy

1. O Railway fará deploy automaticamente
2. Aguarde alguns minutos
3. Clique em **"Settings"** → **"Generate Domain"** para obter a URL pública
4. Acesse: `https://seu-app.railway.app/docs`

## ✅ Passo 7: Verificar Inicialização do Banco

O banco será inicializado automaticamente no primeiro startup através do evento `startup` no `app/main.py`.

**Verifique os logs:**
- Dashboard → Deployments → Selecione o deploy → "View Logs"
- Procure por: "📊 Tabelas do banco criadas/verificadas com sucesso!"

## 🔐 Credenciais Padrão

Após o primeiro deploy, o sistema criará automaticamente:

- **Email:** `admin@sistemaxi.com`
- **Senha:** `admin1234`

⚠️ **IMPORTANTE:** Altere essas credenciais imediatamente após o primeiro login!

## 🆘 Troubleshooting

### Erro: "Unable to connect to database"
- Verifique se o PostgreSQL está rodando
- Confirme que `DATABASE_URL` está configurada corretamente
- Verifique os logs do serviço PostgreSQL

### Erro: "Port already in use"
- O Railway gerencia a porta automaticamente via variável `PORT`
- Não precisa configurar nada

### Tabelas não foram criadas
Execute manualmente via Railway CLI:
```bash
railway run python railway_init.py
```

Ou via interface web:
- Settings → Scripts → Execute: `python railway_init.py`

### CORS Error
Adicione o domínio do frontend em `CORS_ORIGINS`:
```env
CORS_ORIGINS=https://seu-frontend.railway.app
```

## 📊 Estrutura Final no Railway

Você deve ter 2 serviços:

1. **PostgreSQL** (Database)
   - Nome: Postgres (ou o que você escolheu)
   - Variável: `DATABASE_URL` (automática)

2. **FastAPI App** (Service)
   - Nome: CRM-Sistemaxi (ou o que você escolheu)
   - Root Directory: `fastapi-backend`
   - Variáveis: `DATABASE_URL`, `JWT_SECRET_KEY`, etc.

## 🎉 Pronto!

Após seguir estes passos, sua aplicação estará rodando no Railway!

Acesse a documentação da API em: `https://seu-app.railway.app/docs`

