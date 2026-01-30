# 🔧 Solução: Erro pnpm-lock.yaml no Railway

## Problema

O Railway está tentando usar `pnpm` porque detectou um arquivo `pnpm-lock.yaml` na raiz do projeto, mas o projeto usa `npm`.

## ✅ Solução 1: Remover pnpm-lock.yaml (Recomendado)

Se você não precisa do `pnpm-lock.yaml`, remova-o:

```bash
cd /Users/L7/Downloads/squad-sistemaxi2
rm pnpm-lock.yaml
git add .
git commit -m "Remove pnpm-lock.yaml - projeto usa npm"
git push
```

## ✅ Solução 2: Configurar Railway para usar apenas Python

Como o backend está em `fastapi-backend/`, o Railway não precisa instalar dependências Node.js na raiz.

### Opção A: Configurar Root Directory corretamente

No Railway:
1. Settings → Root Directory → `fastapi-backend`
2. Isso fará o Railway focar apenas no diretório Python

### Opção B: Criar .railwayignore

Crie um arquivo `.railwayignore` na raiz:

```
package.json
pnpm-lock.yaml
node_modules/
src/
.next/
```

## ✅ Solução 3: Usar nixpacks.toml (Já criado)

O arquivo `fastapi-backend/nixpacks.toml` foi criado para forçar o uso apenas de Python, ignorando Node.js.

## 🚀 Próximos Passos

1. **Remova o pnpm-lock.yaml** (se não precisar):
   ```bash
   git rm pnpm-lock.yaml
   git commit -m "Remove pnpm-lock.yaml"
   git push
   ```

2. **Verifique Root Directory no Railway:**
   - Settings → Root Directory → `fastapi-backend`

3. **Faça redeploy:**
   - O Railway fará deploy automaticamente após o push

## 📝 Verificação

Após o deploy, verifique os logs. Você deve ver:

```
🔧 Configurando ambiente de build...
🐍 Instalando dependências do backend...
✅ Build concluído!
```

**NÃO deve aparecer:**
- `pnpm install`
- `ERR_PNPM_BROKEN_LOCKFILE`

## ⚠️ Importante

O backend FastAPI **não precisa** das dependências Node.js do frontend para rodar. O frontend pode ser deployado separadamente depois, se necessário.

