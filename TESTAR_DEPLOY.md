# 🧪 Testar Deploy no Railway

## ✅ 1. Verificar se a API está rodando

Acesse: `https://sistemaxi.up.railway.app/`

Deve retornar:
```json
{"message":"Sistemaxi API is running!","version":"1.0.0","docs":"/docs"}
```

✅ Se aparecer isso, a API está rodando!

## ✅ 2. Verificar Health Check

Acesse: `https://sistemaxi.up.railway.app/health`

Deve retornar:
```json
{"status": "healthy", "version": "1.0.0"}
```

## ✅ 3. Criar Tabelas no Banco

Acesse: `https://sistemaxi.up.railway.app/api/init-database`

**OU com secret (se configurou):**
`https://sistemaxi.up.railway.app/api/init-database?secret=SUA_SECRET`

### Resposta Esperada:

```json
{
  "success": true,
  "message": "🎉 Banco de dados inicializado com sucesso!",
  "tables_created": true,
  "admin_user_created": true,
  "admin_credentials": {
    "email": "admin@sistemaxi.com",
    "password": "admin1234"
  }
}
```

## ✅ 4. Verificar Documentação

Acesse: `https://sistemaxi.up.railway.app/docs`

Deve aparecer a documentação interativa do FastAPI (Swagger UI).

## ✅ 5. Testar Login

1. Acesse: `https://sistemaxi.up.railway.app/docs`
2. Expanda o endpoint: `POST /api/v1/auth/login`
3. Clique em "Try it out"
4. Cole este JSON:
```json
{
  "email": "admin@sistemaxi.com",
  "password": "admin1234"
}
```
5. Clique em "Execute"

Deve retornar um token JWT se as tabelas foram criadas!

## 🆘 Problemas Comuns

### Erro: "Unable to connect to database"
→ Verifique se `DATABASE_URL` está configurada via "Add Reference"

### Erro: "relation does not exist"
→ Execute: `https://sistemaxi.up.railway.app/api/init-database`

### Erro 404 no `/api/init-database`
→ Verifique se fez push do código atualizado:
```bash
git add .
git commit -m "Adiciona endpoint init-database"
git push
```

### Nada aparece na tela
→ Verifique os logs no Railway:
- Deployments → View Logs
- Procure por erros

## 📋 Checklist Rápido

- [ ] API responde em `/` ✅
- [ ] Health check funciona em `/health`
- [ ] Endpoint `/api/init-database` existe
- [ ] Tabelas foram criadas (via `/api/init-database`)
- [ ] Documentação acessível em `/docs`
- [ ] Login funciona com admin@sistemaxi.com

