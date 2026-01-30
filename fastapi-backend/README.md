# Sistemaxi API - FastAPI Backend

Backend API organizado e profissional para gerenciamento de projetos usando FastAPI.

## 📁 Estrutura do Projeto

```
fastapi-backend/
├── app/                          # Aplicação principal
│   ├── __init__.py
│   ├── core/                     # Configurações centrais
│   │   ├── __init__.py
│   │   ├── config.py            # Configurações da aplicação
│   │   ├── database.py          # Configuração do banco de dados
│   │   └── security.py          # Autenticação e segurança
│   ├── models/                   # Modelos SQLAlchemy
│   │   ├── __init__.py
│   │   ├── base.py              # Modelo base
│   │   ├── user.py              # Modelo de usuário
│   │   └── project.py           # Modelo de projeto
│   ├── schemas/                  # Schemas Pydantic
│   │   ├── __init__.py
│   │   ├── auth.py              # Schemas de autenticação
│   │   ├── user.py              # Schemas de usuário
│   │   └── project.py           # Schemas de projeto
│   ├── services/                 # Lógica de negócio
│   │   ├── __init__.py
│   │   ├── auth_service.py      # Serviços de autenticação
│   │   ├── user_service.py      # Serviços de usuário
│   │   └── project_service.py   # Serviços de projeto
│   └── api/                      # Endpoints da API
│       ├── __init__.py
│       ├── deps.py              # Dependências (autenticação, etc)
│       └── v1/                  # API versão 1
│           ├── __init__.py
│           ├── api.py           # Router principal
│           └── endpoints/       # Endpoints específicos
│               ├── __init__.py
│               ├── auth.py      # Endpoints de autenticação
│               ├── users.py     # Endpoints de usuários
│               └── projects.py  # Endpoints de projetos
├── main.py                       # Arquivo principal da aplicação
├── requirements.txt              # Dependências Python
├── config.env                    # Configurações de ambiente
├── run.py                        # Script para executar em desenvolvimento
├── init_db.py                    # Script para inicializar banco
└── README.md                     # Este arquivo
```

## 🚀 Como Executar

### 1. Instalar Dependências
```bash
cd fastapi-backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### 2. Configurar Banco de Dados
Edite o arquivo `config.env` com suas configurações:
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

### 3. Inicializar Banco
```bash
python init_db.py
```

### 4. Executar Servidor
```bash
python run.py
```

A API estará disponível em:
- **API**: http://localhost:3001
- **Documentação**: http://localhost:3001/docs
- **Redoc**: http://localhost:3001/redoc

## 📊 Endpoints Principais

### Autenticação
- `POST /api/v1/auth/login` - Login de usuário

### Usuários
- `GET /api/v1/users/me` - Dados do usuário atual
- `GET /api/v1/users/` - Listar usuários (admin)
- `POST /api/v1/users/` - Criar usuário (admin)
- `PUT /api/v1/users/{id}` - Atualizar usuário (admin)
- `DELETE /api/v1/users/{id}` - Deletar usuário (admin)

### Projetos
- `GET /api/v1/projects/` - Listar projetos do usuário
- `GET /api/v1/projects/{id}` - Obter projeto específico
- `POST /api/v1/projects/` - Criar novo projeto
- `PUT /api/v1/projects/{id}` - Atualizar projeto
- `DELETE /api/v1/projects/{id}` - Deletar projeto

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Após o login, inclua o token no header:
```
Authorization: Bearer <seu_token_jwt>
```

### Usuário Admin Padrão
- **Email**: admin@admin.com
- **Senha**: admin

## 🏗️ Arquitetura

### Separação de Responsabilidades

1. **Core**: Configurações centrais, banco de dados, segurança
2. **Models**: Definição das tabelas do banco (SQLAlchemy)
3. **Schemas**: Validação de dados de entrada/saída (Pydantic)
4. **Services**: Lógica de negócio e operações CRUD
5. **API**: Endpoints HTTP e roteamento

### Padrões Utilizados

- **Repository Pattern**: Services encapsulam acesso aos dados
- **Dependency Injection**: FastAPI Depends para injeção de dependências
- **Separation of Concerns**: Cada camada tem responsabilidade específica
- **Clean Architecture**: Estrutura organizada e testável

## 🛠️ Tecnologias

- **FastAPI**: Framework web moderno e rápido
- **SQLAlchemy**: ORM para Python
- **PostgreSQL**: Banco de dados principal
- **JWT**: Autenticação stateless
- **Pydantic**: Validação de dados
- **Uvicorn**: Servidor ASGI

## 📝 Desenvolvimento

Para adicionar novas funcionalidades:

1. **Modelo**: Crie em `app/models/`
2. **Schema**: Defina validações em `app/schemas/`
3. **Service**: Implemente lógica em `app/services/`
4. **Endpoint**: Crie rotas em `app/api/v1/endpoints/`
5. **Router**: Registre no `app/api/v1/api.py` 