# ✅ Checklist: Deploy no Railway

## Passo 1: Criar Banco PostgreSQL ✅
- [ ] No Railway, clique em "New" → "Database" → "Add PostgreSQL"
- [ ] Anote o nome do serviço (ex: "Postgres")

## Passo 2: Criar Serviço da Aplicação ✅
- [ ] Clique em "New" → "GitHub Repo"
- [ ] Selecione: `lucasnuneszx/CRM-Sistemaxi`
- [ ] Aguarde o deploy inicial

## Passo 3: Configurar Root Directory ⚠️ IMPORTANTE
- [ ] No serviço da aplicação → "Settings"
- [ ] Configure "Root Directory" como: **`fastapi-backend`**
- [ ] Clique em "Save"

## Passo 4: Conectar Banco de Dados
- [ ] No serviço da aplicação → "Variables"
- [ ] Clique em "New Variable" → "Add Reference"
- [ ] Selecione o serviço PostgreSQL
- [ ] Selecione `DATABASE_URL`
- [ ] Salve

## Passo 5: Adicionar Variáveis de Ambiente
No serviço da aplicação → "Variables", adicione:

```env
JWT_SECRET_KEY=seu-jwt-secret-key-super-seguro-aqui
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
ENVIRONMENT=production
```

**Gerar JWT_SECRET_KEY seguro:**
```bash
openssl rand -hex 32
```

## Passo 6: Verificar Deploy
- [ ] Aguarde o deploy completar
- [ ] Vá em "Settings" → "Generate Domain"
- [ ] Acesse: `https://seu-app.railway.app/docs`
- [ ] Verifique os logs para confirmar criação das tabelas

## Passo 7: Verificar Inicialização
Nos logs, procure por:
- ✅ "📊 Tabelas do banco criadas/verificadas com sucesso!"
- ✅ "✅ Usuário admin padrão criado"

## 🔐 Credenciais Padrão
- **Email:** `admin@sistemaxi.com`
- **Senha:** `admin1234`

⚠️ **Altere imediatamente após o primeiro login!**

## 🆘 Problemas Comuns

### Erro: "Unable to connect to database"
→ Verifique se `DATABASE_URL` está configurada

### Tabelas não foram criadas
→ Verifique os logs do deploy
→ Execute: `python railway_init.py` via Railway CLI

### CORS Error
→ Adicione: `CORS_ORIGINS=https://seu-frontend.railway.app`

---

**📚 Guia completo:** Veja `GUIA_DEPLOY_RAILWAY.md`

