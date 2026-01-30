from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .core.config import settings
from .core.database import test_connection, create_tables, SessionLocal
from .api.v1.api import api_router
from .api.v1.endpoints import atividades, setores
from fastapi import Depends
from .api.deps import get_current_active_user
from .models.user import User
# Import all models to ensure tables are created
from .models import (
    User, Project, Atividade, Setor, Documento, CasaParceira,
    RelatorioDiario, CredencialAcesso, MetricasRedesSociais,
    Criativo, UserProject, Lead, KanbanColumn, Cliente,
    Proposta, FinanceTransaction, Notificacao
)
from .core.security import get_password_hash
from fastapi import Request
from .core.security import verify_token
from .services.project_service import ProjectService
from .schemas.project import ProjectResponse, ProjectCreate, ProjectUpdate
from sqlalchemy.orm import Session
from .core.database import get_db
from typing import List, Dict, Any
import uuid
import os
from .api.deps import get_current_admin_user

# Create FastAPI app
app = FastAPI(
    title=settings.project_name,
    version=settings.project_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Set up CORS FIRST (antes de outras middlewares)
# IMPORTANTE: Não pode usar allow_origins=["*"] com allow_credentials=True
# Precisamos especificar as origens explicitamente
import os
cors_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

# Adicionar origens do Railway se existirem
railway_public_domain = os.getenv("RAILWAY_PUBLIC_DOMAIN")
if railway_public_domain:
    cors_origins.extend([
        f"https://{railway_public_domain}",
        f"http://{railway_public_domain}",
    ])

# Adicionar variável de ambiente para CORS customizado
custom_cors = os.getenv("CORS_ORIGINS")
if custom_cors:
    cors_origins.extend([origin.strip() for origin in custom_cors.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Handle preflight requests
@app.options("/{full_path:path}")
async def preflight_handler(full_path: str):
    return {"message": "OK"}

# Criar diretório de uploads se não existir
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Servir arquivos estáticos de upload
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include API router
app.include_router(api_router, prefix=settings.api_v1_str)

# Include legacy/direct API routes for frontend compatibility (both with and without trailing slash)
# app.include_router(atividades.router, prefix="/api/atividades", tags=["atividades-legacy"])

# Legacy projects endpoints - proxy to versioned API
@app.get("/api/projects", response_model=List[ProjectResponse])
@app.get("/api/projects/", response_model=List[ProjectResponse])
async def get_projects_legacy(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Legacy projects endpoint - accessible to all authenticated users"""
    projects = ProjectService.get_projects(db, user_id=None, skip=skip, limit=limit)
    return projects

@app.post("/api/projects", response_model=ProjectResponse)
@app.post("/api/projects/", response_model=ProjectResponse)
async def create_project_legacy(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Legacy create project endpoint - proxy to versioned API"""
    return ProjectService.create_project(
        db=db, project=project, owner_id=current_user.id
    )

@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project_legacy(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Legacy project by ID endpoint - accessible to all authenticated users"""
    project = ProjectService.get_project(db, project_id=project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # All authenticated users can access any project
    return project

# Import setores router - usar /api/v1/setores ao invés
# app.include_router(setores.router, prefix="/api/setores", tags=["setores-legacy"])  # Desabilitado - use /api/v1/setores

# Add simple endpoints for other legacy routes that the frontend expects
@app.get("/api/campaigns")
@app.get("/api/campaigns/")
async def get_campaigns(current_user: User = Depends(get_current_active_user)):
    """Legacy campaigns endpoint - returns empty list for now"""
    return []

@app.get("/api/team-members") 
@app.get("/api/team-members/")
async def get_team_members(current_user: User = Depends(get_current_active_user)):
    """Legacy team-members endpoint - returns empty list for now"""
    return []

@app.get("/api/influencers")
@app.get("/api/influencers/")
async def get_influencers(current_user: User = Depends(get_current_active_user)):
    """Legacy influencers endpoint - returns empty list for now"""
    return []

# @app.get("/api/setores")
# @app.get("/api/setores/")
# async def get_setores(current_user: User = Depends(get_current_active_user)):
#     """Legacy setores endpoint - returns empty list for now"""
#     return []

# Legacy users routes removed - use /api/v1/users instead

# Legacy users endpoint for assignment
@app.get("/api/users/for-assignment")
@app.get("/api/users/for-assignment/")
async def get_users_for_assignment_legacy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Legacy users for assignment endpoint"""
    from .services.user_service import UserService
    
    users = UserService.get_users(db, skip=0, limit=1000)
    return [
        {
            "id": str(user.id),
            "name": user.name,
            "email": user.email
        }
        for user in users
        if user.is_active
    ]

# Legacy users endpoint (same as for-assignment for compatibility)
@app.get("/api/users")
@app.get("/api/users/")
async def get_users_legacy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Legacy users endpoint for edit pages"""
    from .services.user_service import UserService
    
    users = UserService.get_users(db, skip=0, limit=1000)
    return [
        {
            "id": str(user.id),
            "name": user.name,
            "email": user.email
        }
        for user in users
        if user.is_active
    ]


# POST endpoint para criar usuários (compatível com frontend)
@app.post("/api/v1/users")
async def create_user_post(
    user_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create new user endpoint (admin only)"""
    from .services.user_service import UserService
    from .schemas.user import UserCreate
    
    # Convert frontend data format to internal format
    if "name" in user_data:
        # Frontend format: name -> name + generate username
        name = user_data.get("name", "")
        # Generate username from name (lowercase, no spaces)
        username = name.lower().replace(" ", "_").replace(".", "_")
        
        user_create_data = {
            "name": name,
            "username": username,
            "email": user_data.get("email", ""),
            "password": user_data.get("password", ""),
            "is_active": True,
            "is_admin": user_data.get("role") == "admin"
        }
        
        # Handle setorId - convert to UUID if provided and not "none"
        setor_id = user_data.get("setorId")
        if setor_id and setor_id != "none":
            try:
                user_create_data["setor_id"] = uuid.UUID(setor_id)
            except ValueError:
                # Invalid UUID, ignore
                pass
        
        user = UserCreate(**user_create_data)
    else:
        # Standard API format
        user = UserCreate(**user_data)
    
    # Check if user already exists
    db_user = UserService.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = UserService.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    created_user = UserService.create_user(db=db, user=user)
    return {
        "id": str(created_user.id),
        "name": created_user.name,
        "email": created_user.email,
        "username": created_user.username,
        "is_active": created_user.is_active,
        "is_admin": created_user.is_admin
    }

# Add debug endpoint
@app.get("/api/debug/headers")
async def debug_headers(request: Request):
    """Debug endpoint to check headers"""
    return {
        "headers": dict(request.headers),
        "authorization": request.headers.get("authorization"),
        "bearer_token": request.headers.get("authorization", "").replace("Bearer ", "") if request.headers.get("authorization") else None
    }

@app.get("/api/debug/token")
async def debug_token(request: Request):
    """Debug endpoint to check token validity"""
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return {"error": "No token provided", "auth_header": auth_header}
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        payload = verify_token(token)
        return {"valid": True, "payload": payload, "token": token[:20] + "..."}
    except Exception as e:
        return {"valid": False, "error": str(e), "token": token[:20] + "..."}

@app.get("/api/auth/check")
async def check_auth_status(current_user: User = Depends(get_current_active_user)):
    """Check if user is authenticated with valid token"""
    return {
        "authenticated": True,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "is_admin": current_user.is_admin
        }
    }

@app.get("/api/test-auth")
async def test_auth(request: Request):
    """Endpoint de teste para debug de autenticação"""
    return {
        "headers": dict(request.headers),
        "authorization": request.headers.get("authorization"),
        "content_type": request.headers.get("content-type"),
        "origin": request.headers.get("origin"),
        "user_agent": request.headers.get("user-agent")
    }

@app.get("/api/debug/setores-auth")
async def debug_setores_auth(request: Request):
    """Debug endpoint específico para verificar autenticação dos setores"""
    auth_header = request.headers.get("authorization")
    headers_info = {
        "authorization": auth_header,
        "content_type": request.headers.get("content-type"),
        "origin": request.headers.get("origin"),
        "user_agent": request.headers.get("user-agent"),
        "all_headers": dict(request.headers)
    }
    
    if not auth_header:
        return {"error": "No authorization header", "headers": headers_info}
    
    if not auth_header.startswith("Bearer "):
        return {"error": "Invalid authorization format", "headers": headers_info}
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        payload = verify_token(token)
        return {
            "valid": True, 
            "payload": payload, 
            "token_preview": token[:20] + "...",
            "headers": headers_info
        }
    except Exception as e:
        return {
            "valid": False, 
            "error": str(e), 
            "token_preview": token[:20] + "...",
            "headers": headers_info
        }

@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    print("🚀 Iniciando Sistemaxi API...")
    
    # Test database connection
    if test_connection():
        # Create tables if they don't exist
        create_tables()
        print("📊 Tabelas do banco criadas/verificadas com sucesso!")

        # Ensure a default admin exists for local/dev usage (does not populate business data)
        try:
            db = SessionLocal()
            try:
                if db.query(User).first() is None:
                    admin_user = User(
                        name="Admin",
                        username="admin",
                        email="admin@sistemaxi.com",
                        hashed_password=get_password_hash("admin1234"),
                        is_active=True,
                        is_admin=True,
                    )
                    db.add(admin_user)
                    db.commit()
                    print("✅ Usuário admin padrão criado (admin@sistemaxi.com / admin1234)")
            finally:
                db.close()
        except Exception as e:
            print(f"⚠️  Falha ao garantir admin padrão: {e}")
    else:
        print("⚠️  Falha na conexão com banco de dados! A aplicação continuará, mas algumas funcionalidades podem não funcionar.")
        # Não fazer exit(1) para permitir que a API inicie mesmo sem banco
    
    # Get port from environment (Railway provides PORT)
    port = os.getenv("PORT", "3001")
    public_url = os.getenv("RAILWAY_PUBLIC_DOMAIN", f"localhost:{port}")
    protocol = "https" if os.getenv("RAILWAY_ENVIRONMENT") else "http"
    
    print(f"✅ API rodando em: {protocol}://{public_url}")
    print(f"📚 Documentação em: {protocol}://{public_url}/docs")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Sistemaxi API is running!",
        "version": settings.project_version,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": settings.project_version}


@app.get("/api/init-database")
async def init_database_endpoint(secret: str = None):
    """
    Endpoint para inicializar o banco de dados e criar todas as tabelas.
    
    Uso: https://sistemaxi.up.railway.app/api/init-database?secret=INIT_SECRET_KEY
    
    Ou sem secret (apenas para desenvolvimento):
    https://sistemaxi.up.railway.app/api/init-database
    """
    # Verificar secret se configurado (opcional, mas recomendado)
    init_secret = os.getenv("INIT_DATABASE_SECRET")
    if init_secret and secret != init_secret:
        raise HTTPException(
            status_code=403,
            detail="Secret key inválida. Configure INIT_DATABASE_SECRET nas variáveis de ambiente."
        )
    
    try:
        # Test connection
        if not test_connection():
            return {
                "success": False,
                "message": "❌ Erro na conexão com banco de dados!",
                "error": "Não foi possível conectar ao banco de dados"
            }
        
        # Create tables
        create_tables()
        
        # Create admin user if not exists
        db = SessionLocal()
        try:
            admin_user = db.query(User).filter(
                (User.email == "admin@sistemaxi.com") | (User.email == "admin@admin.com")
            ).first()
            
            if not admin_user:
                admin_user = User(
                    name="Admin",
                    username="admin",
                    email="admin@sistemaxi.com",
                    hashed_password=get_password_hash("admin1234"),
                    is_active=True,
                    is_admin=True
                )
                db.add(admin_user)
                db.commit()
                admin_created = True
            else:
                admin_created = False
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": "⚠️ Erro ao criar usuário admin",
                "error": str(e),
                "tables_created": True
            }
        finally:
            db.close()
        
        return {
            "success": True,
            "message": "🎉 Banco de dados inicializado com sucesso!",
            "tables_created": True,
            "admin_user_created": admin_created,
            "admin_credentials": {
                "email": "admin@sistemaxi.com",
                "password": "admin1234"
            } if admin_created else "Admin já existia",
            "next_steps": [
                "Acesse /docs para ver a documentação da API",
                "Faça login com as credenciais admin",
                "Altere a senha do admin após o primeiro login"
            ]
        }
    except Exception as e:
        return {
            "success": False,
            "message": "❌ Erro ao inicializar banco de dados",
            "error": str(e)
        }

# Legacy atividade endpoints with frontend field names
@app.get("/api/atividades")
@app.get("/api/atividades/")
async def get_atividades_legacy(
    include: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Legacy atividades list endpoint"""
    from .services.atividade_service import AtividadeService
    
    atividades = AtividadeService.get_atividades(db, user_id=current_user.id, skip=0, limit=1000)
    
    # Convert to frontend format
    result = []
    for atividade in atividades:
        atividade_data = {
            "id": str(atividade.id),
            "nome": atividade.nome,
            "descricao": atividade.descricao,
            "status": atividade.status,
            "prioridade": atividade.prioridade,
            "projetoId": str(atividade.projeto_id) if atividade.projeto_id else None,
            "responsavelId": str(atividade.responsavel_id) if atividade.responsavel_id else None,
            "setorId": str(atividade.setor_id) if atividade.setor_id else None,
            "createdAt": atividade.created_at.isoformat() if atividade.created_at else None,
            "updatedAt": atividade.updated_at.isoformat() if atividade.updated_at else None,
        }
        
        # Add nested objects if requested
        if "projeto" in include and atividade.projeto:
            atividade_data["projeto"] = {
                "id": str(atividade.projeto.id),
                "name": atividade.projeto.name
            }
        
        if "responsavel" in include and atividade.responsavel:
            atividade_data["responsavel"] = {
                "id": str(atividade.responsavel.id),
                "username": atividade.responsavel.username,
                "email": atividade.responsavel.email
            }
        
        if "setor" in include and atividade.setor:
            atividade_data["setor"] = {
                "id": str(atividade.setor.id),
                "nome": atividade.setor.nome
            }
        
        result.append(atividade_data)
    
    return result

@app.get("/api/atividades/{atividade_id}")
@app.get("/api/atividades/{atividade_id}/")
async def get_atividade_legacy(
    atividade_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Legacy atividade by ID endpoint - accessible to all authenticated users"""
    from .services.atividade_service import AtividadeService
    import uuid
    
    # Debug: log da requisição
    print(f"DEBUG - Buscando atividade {atividade_id}")
    print(f"DEBUG - User: {current_user.id if current_user else 'None'}")
    print(f"DEBUG - Authorization header: {request.headers.get('authorization', 'None')}")
    
    try:
        atividade_uuid = uuid.UUID(atividade_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid atividade ID format")
    
    atividade = AtividadeService.get_atividade(db, atividade_id=atividade_uuid)
    if atividade is None:
        raise HTTPException(status_code=404, detail="Atividade not found")
    
    # All authenticated users can access atividades
    return atividade

@app.post("/api/atividades")
@app.post("/api/atividades/")
async def create_atividade_legacy(
    atividade_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Legacy atividade creation endpoint - converts frontend field names"""
    from .schemas.atividade import AtividadeCreate
    from .services.atividade_service import AtividadeService
    import uuid
    
    # Convert frontend field names to backend field names
    converted_data = {
        "nome": atividade_data.get("nome"),
        "descricao": atividade_data.get("descricao"),
        "status": atividade_data.get("status", "Não iniciada"),
        "prioridade": atividade_data.get("prioridade", "Média"),
        "projeto_id": None,
        "responsavel_id": None,
        "setor_id": None
    }
    
    # Convert IDs
    if atividade_data.get("projetoId"):
        try:
            converted_data["projeto_id"] = uuid.UUID(atividade_data["projetoId"])
        except (ValueError, TypeError):
            pass
    
    if atividade_data.get("responsavelId"):
        try:
            converted_data["responsavel_id"] = uuid.UUID(atividade_data["responsavelId"])
        except (ValueError, TypeError):
            pass
    
    if atividade_data.get("setorId"):
        try:
            converted_data["setor_id"] = uuid.UUID(atividade_data["setorId"])
        except (ValueError, TypeError):
            pass
    else:
        # Se não foi especificado setor, usar o setor do usuário logado
        if current_user.setor_id:
            converted_data["setor_id"] = current_user.setor_id
    
    # Create atividade with converted data
    atividade = AtividadeCreate(**converted_data)
    created_atividade = AtividadeService.create_atividade(db=db, atividade=atividade)
    
    # Convert response back to frontend format
    response_data = {
        "id": str(created_atividade.id),
        "nome": created_atividade.nome,
        "descricao": created_atividade.descricao,
        "status": created_atividade.status,
        "prioridade": created_atividade.prioridade,
        "projetoId": str(created_atividade.projeto_id) if created_atividade.projeto_id else None,
        "responsavelId": str(created_atividade.responsavel_id) if created_atividade.responsavel_id else None,
        "setorId": str(created_atividade.setor_id) if created_atividade.setor_id else None,
        "createdAt": created_atividade.created_at.isoformat() if created_atividade.created_at else None,
        "updatedAt": created_atividade.updated_at.isoformat() if created_atividade.updated_at else None,
        "projeto": {
            "id": str(created_atividade.projeto.id),
            "name": created_atividade.projeto.name
        } if created_atividade.projeto else None,
        "responsavel": {
            "id": str(created_atividade.responsavel.id),
            "username": created_atividade.responsavel.username,
            "email": created_atividade.responsavel.email
        } if created_atividade.responsavel else None,
        "setor": {
            "id": str(created_atividade.setor.id),
            "nome": created_atividade.setor.nome
        } if created_atividade.setor else None
    }
    
    return response_data

@app.put("/api/atividades/{atividade_id}")
@app.put("/api/atividades/{atividade_id}/")
async def update_atividade_legacy(
    atividade_id: str,
    atividade_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Legacy atividade update endpoint - accessible to all authenticated users"""
    from .schemas.atividade import AtividadeUpdate
    from .services.atividade_service import AtividadeService
    import uuid
    
    try:
        atividade_uuid = uuid.UUID(atividade_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid atividade ID format")
    
    # Check if atividade exists
    atividade = AtividadeService.get_atividade(db, atividade_id=atividade_uuid)
    if atividade is None:
        raise HTTPException(status_code=404, detail="Atividade not found")
    
    # All authenticated users can update atividades
    
    # Convert frontend field names to backend field names
    converted_data = {}
    
    if "nome" in atividade_data:
        converted_data["nome"] = atividade_data["nome"]
    if "descricao" in atividade_data:
        converted_data["descricao"] = atividade_data["descricao"]
    if "status" in atividade_data:
        converted_data["status"] = atividade_data["status"]
    if "prioridade" in atividade_data:
        converted_data["prioridade"] = atividade_data["prioridade"]
    
    # Convert IDs
    if "projetoId" in atividade_data:
        if atividade_data["projetoId"]:
            try:
                converted_data["projeto_id"] = uuid.UUID(atividade_data["projetoId"])
            except (ValueError, TypeError):
                pass
        else:
            converted_data["projeto_id"] = None
    
    if "responsavelId" in atividade_data:
        if atividade_data["responsavelId"]:
            try:
                converted_data["responsavel_id"] = uuid.UUID(atividade_data["responsavelId"])
            except (ValueError, TypeError):
                pass
        else:
            converted_data["responsavel_id"] = None
    
    if "setorId" in atividade_data:
        if atividade_data["setorId"]:
            try:
                converted_data["setor_id"] = uuid.UUID(atividade_data["setorId"])
            except (ValueError, TypeError):
                pass
        else:
            converted_data["setor_id"] = None
    
    # Update atividade with converted data
    atividade_update = AtividadeUpdate(**converted_data)
    updated_atividade = AtividadeService.update_atividade(
        db, atividade_id=atividade_uuid, atividade_update=atividade_update
    )
    
    # Convert response back to frontend format
    response_data = {
        "id": str(updated_atividade.id),
        "nome": updated_atividade.nome,
        "descricao": updated_atividade.descricao,
        "status": updated_atividade.status,
        "prioridade": updated_atividade.prioridade,
        "projetoId": str(updated_atividade.projeto_id) if updated_atividade.projeto_id else None,
        "responsavelId": str(updated_atividade.responsavel_id) if updated_atividade.responsavel_id else None,
        "setorId": str(updated_atividade.setor_id) if updated_atividade.setor_id else None,
        "createdAt": updated_atividade.created_at.isoformat() if updated_atividade.created_at else None,
        "updatedAt": updated_atividade.updated_at.isoformat() if updated_atividade.updated_at else None,
        "projeto": {
            "id": str(updated_atividade.projeto.id),
            "name": updated_atividade.projeto.name
        } if updated_atividade.projeto else None,
        "responsavel": {
            "id": str(updated_atividade.responsavel.id),
            "username": updated_atividade.responsavel.username,
            "email": updated_atividade.responsavel.email
        } if updated_atividade.responsavel else None,
        "setor": {
            "id": str(updated_atividade.setor.id),
            "nome": updated_atividade.setor.nome
        } if updated_atividade.setor else None
    }
    
    return response_data

@app.delete("/api/atividades/{atividade_id}")
@app.delete("/api/atividades/{atividade_id}/")
async def delete_atividade_legacy(
    atividade_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Legacy atividade delete endpoint - accessible to all authenticated users"""
    from .services.atividade_service import AtividadeService
    import uuid
    
    try:
        atividade_uuid = uuid.UUID(atividade_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid atividade ID format")
    
    # Check if atividade exists
    atividade = AtividadeService.get_atividade(db, atividade_id=atividade_uuid)
    if atividade is None:
        raise HTTPException(status_code=404, detail="Atividade not found")
    
    # All authenticated users can delete atividades
    success = AtividadeService.delete_atividade(db, atividade_id=atividade_uuid)
    if not success:
        raise HTTPException(status_code=404, detail="Atividade not found")
    
    return {"message": "Atividade deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001) 