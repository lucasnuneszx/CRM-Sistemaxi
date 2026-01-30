from fastapi import APIRouter
from .endpoints import auth, users, projects, atividades, setores, documentos, casas_parceiras, criativos, user_projects, leads, kanban_columns, clientes, propostas, notificacoes
from . import relatorios_diarios, credenciais_acesso, metricas_redes_sociais

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(user_projects.router, prefix="/user-projects", tags=["user-projects"])
api_router.include_router(atividades.router, prefix="/atividades", tags=["atividades"])
api_router.include_router(setores.router, prefix="/setores", tags=["setores"])
api_router.include_router(documentos.router, prefix="/documentos", tags=["documentos"])
api_router.include_router(casas_parceiras.router, prefix="/casas-parceiras", tags=["casas-parceiras"])
api_router.include_router(criativos.router, prefix="/criativos", tags=["criativos"])
api_router.include_router(relatorios_diarios.router, prefix="/relatorios-diarios", tags=["relatorios-diarios"])
api_router.include_router(credenciais_acesso.router, prefix="/credenciais-acesso", tags=["credenciais-acesso"])
api_router.include_router(metricas_redes_sociais.router, prefix="/metricas-redes-sociais", tags=["metricas-redes-sociais"])
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])
api_router.include_router(kanban_columns.router, prefix="/kanban-columns", tags=["kanban-columns"])
api_router.include_router(clientes.router, prefix="/clientes", tags=["clientes"])
api_router.include_router(propostas.router, prefix="/propostas", tags=["propostas"])
api_router.include_router(notificacoes.router, prefix="/notificacoes", tags=["notificacoes"]) 