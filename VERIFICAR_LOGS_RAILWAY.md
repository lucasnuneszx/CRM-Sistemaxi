# 🔍 Como Verificar Logs no Railway

## 📋 Passo a Passo para Ver os Logs

### 1. Acessar os Logs de Deploy

1. No Railway, vá em **"Deployments"**
2. Clique no deploy que está com erro (geralmente o mais recente)
3. Clique em **"View Logs"** ou **"Logs"**
4. Role até o **final dos logs** (os erros aparecem no final)

### 2. O que Procurar nos Logs

Procure por estas mensagens de erro:

#### ❌ Erros Comuns:

```
ModuleNotFoundError: No module named 'app'
```
→ **Solução:** Root Directory não está como `fastapi-backend`

```
ImportError: cannot import name 'X' from 'Y'
```
→ **Solução:** Dependência faltando ou caminho incorreto

```
Unable to connect to database
```
→ **Solução:** DATABASE_URL não configurada

```
Port already in use
```
→ **Solução:** Normal, Railway gerencia a porta

```
FileNotFoundError: requirements.txt
```
→ **Solução:** Arquivo não está no lugar certo

### 3. Verificar Build Logs vs Runtime Logs

- **Build Logs:** Mostram erros durante a instalação de dependências
- **Runtime Logs:** Mostram erros quando a aplicação tenta iniciar

Verifique **AMBOS**!

## 🔧 Checklist Rápido

Antes de ver os logs, verifique:

- [ ] **Root Directory** = `fastapi-backend` (Settings)
- [ ] **DATABASE_URL** configurada (Variables → Add Reference)
- [ ] **JWT_SECRET_KEY** configurada
- [ ] **ENVIRONMENT** = `production`
- [ ] Código foi commitado e pushado

## 📝 O que Fazer

1. **Copie os logs COMPLETOS** (últimas 50-100 linhas)
2. **Me envie os logs** para eu identificar o erro exato
3. **Verifique Root Directory** enquanto isso

## 🆘 Se Não Conseguir Ver os Logs

1. Tente fazer **Redeploy**:
   - Deployments → 3 pontos → Redeploy
2. Aguarde o build
3. Verifique os logs novamente

