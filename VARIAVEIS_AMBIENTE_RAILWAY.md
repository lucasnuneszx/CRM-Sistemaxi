# 🔐 Variáveis de Ambiente Necessárias - Railway

## ✅ Variáveis Obrigatórias

### 1. Banco de Dados (Automático pelo Railway)
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
```
**Nota:** Configure via "Add Reference" no Railway, não manualmente.

### 2. JWT (Autenticação)
```env
JWT_SECRET_KEY=seu-jwt-secret-key-super-seguro-aqui
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

**Para gerar JWT_SECRET_KEY seguro:**
```bash
openssl rand -hex 32
```

### 3. Ambiente
```env
ENVIRONMENT=production
```

## 🔧 Variáveis Opcionais (mas Recomendadas)

### 4. Inicialização do Banco (Segurança)
```env
INIT_DATABASE_SECRET=sua-chave-secreta-para-init
```
**Uso:** Protege o endpoint `/api/init-database` com uma chave secreta.

### 5. CORS (Se tiver frontend separado)
```env
CORS_ORIGINS=https://seu-frontend.railway.app,https://seu-dominio.com
```

### 6. MinIO (Armazenamento de Arquivos)
```env
MINIO_ENDPOINT=s3api.sellhuub.com
MINIO_ACCESS_KEY=sua-access-key
MINIO_SECRET_KEY=sua-secret-key
MINIO_BUCKET_NAME=squad
MINIO_USE_SSL=true
```

## 📋 Checklist Completo de Variáveis

### No Railway, adicione estas variáveis:

#### ✅ Do PostgreSQL (via Reference):
- [ ] `DATABASE_URL` (Add Reference → PostgreSQL → DATABASE_URL)

#### ✅ Manuais (adicione uma por uma):
- [ ] `JWT_SECRET_KEY` = `[gerar com: openssl rand -hex 32]`
- [ ] `JWT_ALGORITHM` = `HS256`
- [ ] `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` = `1440`
- [ ] `ENVIRONMENT` = `production`
- [ ] `INIT_DATABASE_SECRET` = `[opcional, mas recomendado]`

#### ✅ Opcionais:
- [ ] `CORS_ORIGINS` = `https://seu-frontend.railway.app` (se tiver frontend)
- [ ] `MINIO_ENDPOINT` = `s3api.sellhuub.com` (se usar MinIO)
- [ ] `MINIO_ACCESS_KEY` = `[sua-key]` (se usar MinIO)
- [ ] `MINIO_SECRET_KEY` = `[sua-secret]` (se usar MinIO)
- [ ] `MINIO_BUCKET_NAME` = `squad` (se usar MinIO)
- [ ] `MINIO_USE_SSL` = `true` (se usar MinIO)

## 🚀 Como Configurar no Railway

1. No serviço da aplicação, vá em **"Variables"**
2. Para `DATABASE_URL`: Clique em **"New Variable"** → **"Add Reference"** → Selecione PostgreSQL → `DATABASE_URL`
3. Para as outras: Clique em **"New Variable"** → Adicione manualmente cada uma

## 🔗 URL para Criar Tabelas

### Opção 1: Sem Secret (Desenvolvimento)
```
https://sistemaxi.up.railway.app/api/init-database
```

### Opção 2: Com Secret (Recomendado para Produção)
```
https://sistemaxi.up.railway.app/api/init-database?secret=SUA_INIT_DATABASE_SECRET
```

**Exemplo:**
```
https://sistemaxi.up.railway.app/api/init-database?secret=minha-chave-secreta-123
```

## ✅ Resposta Esperada

Ao acessar a URL, você deve receber:

```json
{
  "success": true,
  "message": "🎉 Banco de dados inicializado com sucesso!",
  "tables_created": true,
  "admin_user_created": true,
  "admin_credentials": {
    "email": "admin@sistemaxi.com",
    "password": "admin1234"
  },
  "next_steps": [
    "Acesse /docs para ver a documentação da API",
    "Faça login com as credenciais admin",
    "Altere a senha do admin após o primeiro login"
  ]
}
```

## 🔐 Segurança

⚠️ **IMPORTANTE:**
- Configure `INIT_DATABASE_SECRET` para proteger o endpoint
- Altere a senha do admin após o primeiro login
- Use um `JWT_SECRET_KEY` forte e único
- Não compartilhe as credenciais em produção

## 📝 Valores Padrão

Se uma variável não for configurada, o sistema usará estes valores padrão:

- `JWT_SECRET_KEY`: `your-super-secret-jwt-key` (⚠️ MUDE EM PRODUÇÃO!)
- `JWT_ALGORITHM`: `HS256`
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`: `1440` (24 horas)
- `ENVIRONMENT`: `development`
- `MINIO_ENDPOINT`: `s3api.sellhuub.com`
- `MINIO_BUCKET_NAME`: `squad`
- `MINIO_USE_SSL`: `true`

## 🆘 Troubleshooting

### Erro: "Secret key inválida"
→ Configure `INIT_DATABASE_SECRET` ou remova o parâmetro `secret` da URL

### Erro: "Unable to connect to database"
→ Verifique se `DATABASE_URL` está configurada corretamente

### Erro: "relation does not exist"
→ Execute a URL de inicialização: `/api/init-database`

