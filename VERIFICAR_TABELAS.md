# ✅ Verificar Criação das Tabelas no Railway

## 🔍 Verificação Automática

As tabelas devem ser criadas **automaticamente** quando a aplicação iniciar pela primeira vez.

### Como Verificar nos Logs:

1. No Railway, vá em **"Deployments"**
2. Selecione o deploy mais recente
3. Clique em **"View Logs"**
4. Procure por estas mensagens:

```
🚀 Iniciando Sistemaxi API...
✅ Conexão com banco de dados bem-sucedida!
📍 Database URL: postgresql://***@***:***/***
📊 Tabelas do banco criadas/verificadas com sucesso!
✅ Usuário admin padrão criado (admin@sistemaxi.com / admin1234)
✅ API rodando em: https://seu-app.railway.app
```

### ✅ Se apareceram essas mensagens:

**Parabéns!** As tabelas foram criadas com sucesso! 🎉

Você pode testar a API:
- Acesse: `https://seu-app.railway.app/docs`
- Faça login com: `admin@sistemaxi.com` / `admin1234`

## 🔧 Se as tabelas NÃO foram criadas:

### Opção 1: Executar Script Manualmente via Railway CLI

Se você tem o Railway CLI instalado:

```bash
railway run python railway_init.py
```

### Opção 2: Executar via Interface Web do Railway

1. No serviço da aplicação, vá em **"Settings"**
2. Role até **"Scripts"** ou **"Run Command"**
3. Execute: `python railway_init.py`

### Opção 3: Fazer Redeploy

1. No Railway, vá em **"Deployments"**
2. Clique nos **3 pontos** no deploy mais recente
3. Selecione **"Redeploy"**

Isso fará a aplicação reiniciar e executar o código de inicialização novamente.

## 📊 Tabelas que Devem Ser Criadas:

O sistema cria automaticamente estas tabelas:

- ✅ `users` - Usuários
- ✅ `setores` - Setores
- ✅ `projects` - Projetos
- ✅ `atividades` - Atividades
- ✅ `clientes` - Clientes
- ✅ `leads` - Leads (Funil de Vendas)
- ✅ `kanban_columns` - Colunas do Kanban
- ✅ `propostas` - Propostas
- ✅ `documentos` - Documentos
- ✅ `casas_parceiras` - Casas Parceiras
- ✅ `relatorios_diarios` - Relatórios Diários
- ✅ `credenciais_acesso` - Credenciais de Acesso
- ✅ `metricas_redes_sociais` - Métricas de Redes Sociais
- ✅ `criativos` - Criativos
- ✅ `user_projects` - Usuários-Projetos
- ✅ `finance_transactions` - Transações Financeiras
- ✅ `notificacoes` - Notificações

## 🧪 Testar se as Tabelas Foram Criadas:

### Via API:

1. Acesse: `https://seu-app.railway.app/docs`
2. Tente fazer login:
   - POST `/api/v1/auth/login`
   - Email: `admin@sistemaxi.com`
   - Password: `admin1234`

Se funcionar, as tabelas foram criadas! ✅

### Via PostgreSQL (se tiver acesso):

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

## 🆘 Problemas Comuns:

### Erro: "relation does not exist"

**Solução:** Execute o script de inicialização:
```bash
railway run python railway_init.py
```

### Erro: "Unable to connect to database"

**Solução:** Verifique se `DATABASE_URL` está configurada corretamente nas variáveis de ambiente.

### Erro: "permission denied"

**Solução:** Verifique se o usuário do banco tem permissões para criar tabelas.

## ✅ Próximos Passos:

Após confirmar que as tabelas foram criadas:

1. ✅ Teste a API em `/docs`
2. ✅ Faça login com o usuário admin
3. ✅ Altere a senha do admin
4. ✅ Comece a usar a aplicação!

---

**📚 Scripts disponíveis:**
- `railway_init.py` - Inicialização completa (tabelas + admin)
- `init_db.py` - Inicialização básica
- `ensure_all_tables.py` - Verifica e cria tabelas faltantes

