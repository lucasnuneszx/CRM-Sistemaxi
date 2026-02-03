# 🚀 Como Deployar o Frontend Next.js no Railway

## 📋 Situação Atual:
- ✅ Backend FastAPI está deployado e funcionando em `sistemaxi.up.railway.app`
- ❌ Frontend Next.js ainda não está deployado

## 🎯 Objetivo:
Deployar o frontend Next.js no Railway em um serviço separado.

## 📝 Passo a Passo:

### 1. Criar Novo Serviço no Railway

1. **No Railway Dashboard**, vá no seu projeto
2. Clique em **"+ New"** → **"GitHub Repo"**
3. Selecione o mesmo repositório: `lucasnuneszx/CRM-Sistemaxi`
4. **IMPORTANTE**: Configure o **"Root Directory"** para a **raiz do projeto** (não `fastapi-backend`)

### 2. Configurar Variáveis de Ambiente

No novo serviço do Frontend, adicione estas variáveis:

```
NEXT_PUBLIC_API_URL=https://sistemaxi.up.railway.app
NEXT_PUBLIC_API_BASE_URL=https://sistemaxi.up.railway.app/api
NODE_ENV=production
PORT=3000
```

**Como adicionar:**
- Vá em **Settings** → **Variables**
- Clique em **"+ New Variable"**
- Adicione cada variável acima

### 3. Configurar Build

O Railway deve detectar automaticamente que é um projeto Next.js, mas se não funcionar:

1. Vá em **Settings** → **Build**
2. Certifique-se que está usando **Nixpacks**
3. O Railway deve usar o `nixpacks.toml` que criamos

### 4. Deploy

1. O Railway fará deploy automaticamente após configurar
2. Aguarde 3-5 minutos para o build
3. Verifique os logs para garantir que está funcionando

### 5. Configurar CORS no Backend

O backend precisa permitir requisições do frontend. Verifique se o CORS está configurado corretamente no `fastapi-backend/app/main.py`:

```python
backend_cors_origins: List[str] = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://sistemaxi.up.railway.app",  # Backend
    "https://SEU-FRONTEND.up.railway.app"  # Frontend (substitua pela URL real)
]
```

## 🔍 Verificação:

Após o deploy, você deve ter:
- **Backend**: `https://sistemaxi.up.railway.app` ✅ (já funcionando)
- **Frontend**: `https://SEU-FRONTEND.up.railway.app` (nova URL)

## 🆘 Troubleshooting:

### Se o build falhar:
- Verifique os logs do Railway
- Certifique-se que o `Root Directory` está correto (raiz do projeto, não `fastapi-backend`)
- Verifique se todas as dependências estão no `package.json`

### Se o frontend não conectar com o backend:
- Verifique se `NEXT_PUBLIC_API_URL` está configurada corretamente
- Verifique o CORS no backend
- Abra o console do navegador para ver erros de CORS

### Se aparecer erro 404:
- Verifique se o `PORT` está configurado (Railway fornece automaticamente)
- Verifique os logs do Railway

## 📝 Notas:

- O frontend e backend são **serviços separados** no Railway
- Cada um tem sua própria URL
- O frontend faz requisições HTTP para o backend
- Certifique-se de atualizar o CORS no backend com a URL do frontend

