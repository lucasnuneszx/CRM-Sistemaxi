# 🚀 Configuração do Vercel - Sistemaxi

## 📋 Variáveis de Ambiente

Configure estas variáveis no painel do Vercel:

### 1. Acesse o painel do Vercel
- Vá para [vercel.com](https://vercel.com)
- Selecione seu projeto
- Vá em **Settings** → **Environment Variables**

### 2. Adicione as seguintes variáveis:

```bash
# Backend URL (para proxy server-side)
BACKEND_URL=http://78.142.242.97:3001

# URLs públicas da API (deixe em branco para usar proxy automático)
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_API_BASE_URL=
```

## 🔧 Como funciona

### Desenvolvimento Local
- Usa URLs diretas: `http://localhost:3001`
- Sem proxy necessário

### Produção (Vercel HTTPS)
- Detecta automaticamente que está em HTTPS
- Redireciona chamadas através do proxy: `https://seu-app.vercel.app/api/proxy/*`
- O proxy faz a chamada HTTP para o backend e retorna via HTTPS

## 🌐 Fluxo de Requisições

```
Frontend (HTTPS) → /api/proxy/api/v1/auth/login → Backend (HTTP) → Resposta (HTTPS)
```

## ✅ Testando

Após deploy:

1. **Abra o console do navegador**
2. **Faça login** - deve aparecer logs como:
   ```
   [PROXY] POST http://78.142.242.97:3001/api/v1/auth/login
   ```
3. **Não deve haver erros de Mixed Content**

## 🔄 Redeploy

Após configurar as variáveis:
1. Vá em **Deployments**
2. Clique nos três pontos da última deployment
3. Selecione **Redeploy**

## 🐛 Troubleshooting

### Erro "Mixed Content" ainda aparece
- Verifique se `BACKEND_URL` está configurado
- Confirme que as variáveis `NEXT_PUBLIC_*` estão vazias

### Proxy não funciona
- Verifique logs no Vercel: **Functions** → **View Function Logs**
- Teste endpoint: `https://seu-app.vercel.app/api/proxy/api/v1/auth/login`

### Backend não responde
- Confirme que o backend está rodando em `http://78.142.242.97:3001`
- Teste direto: `curl http://78.142.242.97:3001/api/v1/auth/login` 