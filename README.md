# Squad Sistemaxi

Sistema de gestão de marketing e campanhas para especialistas.

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ e npm
- Python 3.10+
- PostgreSQL (opcional, pode usar SQLite para desenvolvimento)

### Instalação

1. **Instalar todas as dependências:**
```bash
chmod +x install.sh
./install.sh
```

Ou instale manualmente:

2. **Frontend (Next.js):**
```bash
npm install
```

3. **Backend (FastAPI):**
```bash
cd fastapi-backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### Configuração do Banco de Dados

1. Edite o arquivo `fastapi-backend/config.env`:
```env
# Para desenvolvimento local (SQLite):
DATABASE_URL=sqlite:///./sistemaxi_local.db

# Ou para PostgreSQL:
# DATABASE_URL=postgresql://usuario:senha@localhost:5432/sistemaxi
```

2. Inicialize o banco de dados:
```bash
cd fastapi-backend
source venv/bin/activate
python init_db.py
```

### Executar o Projeto

**Backend (porta 3001):**
```bash
cd fastapi-backend
source venv/bin/activate
python run.py
```

**Frontend (porta 3000):**
```bash
npm run dev
```

Acesse:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Documentação API: http://localhost:3001/docs

## 📁 Estrutura do Projeto

```
squad-sistemaxi2/
├── src/                    # Frontend Next.js
│   ├── app/               # Páginas e rotas
│   ├── components/        # Componentes React
│   ├── config/            # Configurações
│   └── context/           # Contextos React
├── fastapi-backend/        # Backend FastAPI
│   ├── app/               # Aplicação principal
│   ├── models.py          # Modelos de dados
│   ├── schemas.py         # Schemas Pydantic
│   └── requirements.txt   # Dependências Python
└── prisma/                # Schema Prisma (opcional)
```

## 🔐 Credenciais Padrão

Após inicializar o banco de dados:
- Email: `admin@admin.com`
- Senha: `admin`

## 🛠️ Tecnologias

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL/SQLite
- **Autenticação:** JWT

## 📝 Licença

Proprietário - Squad Sistemaxi
