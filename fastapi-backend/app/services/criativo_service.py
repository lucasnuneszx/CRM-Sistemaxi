from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from ..models.criativo import Criativo, StatusCriativo, TipoArquivo
from ..models.project import Project
from ..models.user_project import UserProject
from ..services.user_project_service import UserProjectService
from ..schemas.criativo import (
    CriativoCreate, CriativoUpdate, CriativoResponse, 
    CriativoKanban, CriativosKanbanResponse, CriativosStats,
    PRIORIDADE_REVERSE_MAP
)


class CriativoService:
    def __init__(self, db: Session):
        self.db = db

    def create_criativo(self, criativo_data: CriativoCreate, user_id: UUID, user_is_admin: bool = False) -> CriativoResponse:
        """Criar novo criativo"""
        # Converter dados para o formato do DB
        data_dict = criativo_data.model_dump(by_alias=True, exclude_unset=True)
        
        # Mapear prioridade para inteiro
        if 'prioridade' in data_dict:
            prioridade_str = data_dict['prioridade']
            data_dict['prioridade'] = PRIORIDADE_REVERSE_MAP.get(prioridade_str, 2)
        
        # Mapear campos com nomes diferentes
        if 'titulo' in data_dict:
            data_dict['nome'] = data_dict.pop('titulo')
        if 'tipo_arquivo' in data_dict:
            tipo_str = data_dict.pop('tipo_arquivo')
            # Converter string para enum
            try:
                data_dict['tipo'] = TipoArquivo(tipo_str)
            except ValueError:
                # Se não conseguir converter, usar DOCUMENTO como padrão
                data_dict['tipo'] = TipoArquivo.DOCUMENTO
        if 'arquivo_bruto_url' in data_dict:
            data_dict['arquivo_cru_key'] = data_dict.pop('arquivo_bruto_url')
        
        # Lógica de projeto baseada em roles
        if not user_is_admin:
            # Para usuários não-admin, pegar projeto baseado nas atribuições
            user_projects = UserProjectService.get_user_projects(self.db, user_id)
            
            if not user_projects:
                # Se não tem projetos atribuídos, verificar se é owner de algum projeto
                owned_project = self.db.query(Project).filter(Project.owner_id == user_id).first()
                if not owned_project:
                    raise ValueError("Usuário não possui projetos atribuídos. Contate um administrador.")
                data_dict['projeto_id'] = owned_project.id
            else:
                # Usar o primeiro projeto atribuído
                data_dict['projeto_id'] = user_projects[0].project_id
        else:
            # Para admins, projeto_id deve vir no payload
            if 'projeto_id' not in data_dict or not data_dict['projeto_id']:
                raise ValueError("Projeto é obrigatório para administradores.")
        
        criativo = Criativo(
            **data_dict,
            criado_por_id=user_id
        )
        
        self.db.add(criativo)
        self.db.commit()
        self.db.refresh(criativo)
        
        return CriativoResponse.from_orm_with_mapping(criativo)

    def get_criativo(self, criativo_id: UUID) -> Optional[CriativoResponse]:
        """Buscar criativo por ID"""
        criativo = self.db.query(Criativo).filter(Criativo.id == criativo_id).first()
        
        if criativo:
            return CriativoResponse.from_orm_with_mapping(criativo)
        return None

    def get_criativos(
        self, 
        projeto_id: Optional[UUID] = None,
        status: Optional[StatusCriativo] = None,
        tipo_arquivo: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[CriativoResponse]:
        """Listar criativos com filtros"""
        query = self.db.query(Criativo)
        
        if projeto_id:
            query = query.filter(Criativo.projeto_id == projeto_id)
        
        if status:
            query = query.filter(Criativo.status == status)
        
        if tipo_arquivo:
            query = query.filter(Criativo.tipo == tipo_arquivo)
        
        criativos = query.offset(skip).limit(limit).all()
        
        return [CriativoResponse.from_orm_with_mapping(criativo) for criativo in criativos]

    def get_user_criativos(
        self, 
        user_id: UUID,
        user_is_admin: bool = False,
        projeto_id: Optional[UUID] = None,
        status: Optional[StatusCriativo] = None,
        tipo_arquivo: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[CriativoResponse]:
        """Listar criativos acessíveis ao usuário"""
        if user_is_admin:
            # Admin pode ver todos os criativos
            return self.get_criativos(projeto_id, status, tipo_arquivo, skip, limit)
        
        # Buscar projetos acessíveis ao usuário
        accessible_projects = UserProjectService.get_user_projects(self.db, user_id)
        accessible_project_ids = [up.project_id for up in accessible_projects]
        
        # Adicionar projetos que o usuário possui
        owned_projects = self.db.query(Project).filter(Project.owner_id == user_id).all()
        accessible_project_ids.extend([p.id for p in owned_projects])
        
        # Remover duplicatas
        accessible_project_ids = list(set(accessible_project_ids))
        
        if not accessible_project_ids:
            return []
        
        # Filtrar criativos apenas dos projetos acessíveis
        query = self.db.query(Criativo).filter(Criativo.projeto_id.in_(accessible_project_ids))
        
        if projeto_id and projeto_id in accessible_project_ids:
            query = query.filter(Criativo.projeto_id == projeto_id)
        
        if status:
            query = query.filter(Criativo.status == status)
        
        if tipo_arquivo:
            query = query.filter(Criativo.tipo == tipo_arquivo)
        
        criativos = query.offset(skip).limit(limit).all()
        
        return [CriativoResponse.from_orm_with_mapping(criativo) for criativo in criativos]

    def update_criativo(
        self, 
        criativo_id: UUID, 
        criativo_data: CriativoUpdate,
        user_id: Optional[UUID] = None
    ) -> Optional[CriativoResponse]:
        """Atualizar criativo"""
        criativo = self.db.query(Criativo).filter(Criativo.id == criativo_id).first()
        
        if not criativo:
            return None
        
        # Converter dados para o formato do DB
        update_data = criativo_data.model_dump(by_alias=True, exclude_unset=True)
        
        # Mapear prioridade para inteiro
        if 'prioridade' in update_data:
            prioridade_str = update_data['prioridade']
            update_data['prioridade'] = PRIORIDADE_REVERSE_MAP.get(prioridade_str, 2)
        
        # Mapear campos com nomes diferentes
        if 'titulo' in update_data:
            update_data['nome'] = update_data.pop('titulo')
        if 'tipo_arquivo' in update_data:
            tipo_str = update_data.pop('tipo_arquivo')
            # Converter string para enum
            try:
                update_data['tipo'] = TipoArquivo(tipo_str)
            except ValueError:
                # Se não conseguir converter, usar DOCUMENTO como padrão
                update_data['tipo'] = TipoArquivo.DOCUMENTO
        if 'arquivo_bruto_url' in update_data:
            update_data['arquivo_cru_key'] = update_data.pop('arquivo_bruto_url')
        if 'arquivo_editado_url' in update_data:
            update_data['arquivo_editado_key'] = update_data.pop('arquivo_editado_url')
        if 'editado_por_id' in update_data:
            update_data['editor_id'] = update_data.pop('editado_por_id')
        
        # Se o status foi alterado e há um usuário, marcar como editado por
        if "status" in update_data and user_id:
            update_data["editor_id"] = user_id
        
        update_data["updated_at"] = datetime.utcnow()
        
        for field, value in update_data.items():
            if hasattr(criativo, field):
                setattr(criativo, field, value)
        
        self.db.commit()
        self.db.refresh(criativo)
        
        return CriativoResponse.from_orm_with_mapping(criativo)

    def delete_criativo(self, criativo_id: UUID) -> bool:
        """Deletar criativo"""
        criativo = self.db.query(Criativo).filter(Criativo.id == criativo_id).first()
        
        if criativo:
            self.db.delete(criativo)
            self.db.commit()
            return True
        
        return False

    def get_kanban_view(self, projeto_id: Optional[UUID] = None) -> CriativosKanbanResponse:
        """Buscar criativos organizados por status para visualização Kanban"""
        query = self.db.query(Criativo)
        
        if projeto_id:
            query = query.filter(Criativo.projeto_id == projeto_id)
        
        criativos = query.all()
        
        # Agrupar por status
        kanban_data = {
            "material_cru": [],
            "em_edicao": [],
            "aguardando_revisao": [],
            "aprovado": [],
            "rejeitado": []
        }
        
        for criativo in criativos:
            criativo_kanban = CriativoKanban.from_orm_with_mapping(criativo)
            kanban_data[criativo.status.value].append(criativo_kanban)
        
        return CriativosKanbanResponse(**kanban_data)

    def get_user_kanban_view(
        self, 
        user_id: UUID, 
        user_is_admin: bool = False, 
        projeto_id: Optional[UUID] = None
    ) -> CriativosKanbanResponse:
        """Buscar criativos organizados por status para visualização Kanban (filtrado por usuário)"""
        if user_is_admin:
            return self.get_kanban_view(projeto_id)
        
        # Buscar projetos acessíveis ao usuário
        accessible_projects = UserProjectService.get_user_projects(self.db, user_id)
        accessible_project_ids = [up.project_id for up in accessible_projects]
        
        # Adicionar projetos que o usuário possui
        owned_projects = self.db.query(Project).filter(Project.owner_id == user_id).all()
        accessible_project_ids.extend([p.id for p in owned_projects])
        
        # Remover duplicatas
        accessible_project_ids = list(set(accessible_project_ids))
        
        if not accessible_project_ids:
            return CriativosKanbanResponse(
                material_cru=[], em_edicao=[], aguardando_revisao=[], aprovado=[], rejeitado=[]
            )
        
        # Filtrar criativos apenas dos projetos acessíveis
        query = self.db.query(Criativo).filter(Criativo.projeto_id.in_(accessible_project_ids))
        
        if projeto_id and projeto_id in accessible_project_ids:
            query = query.filter(Criativo.projeto_id == projeto_id)
        
        criativos = query.all()
        
        # Agrupar por status
        kanban_data = {
            "material_cru": [],
            "em_edicao": [],
            "aguardando_revisao": [],
            "aprovado": [],
            "rejeitado": []
        }
        
        for criativo in criativos:
            criativo_kanban = CriativoKanban.from_orm_with_mapping(criativo)
            kanban_data[criativo.status.value].append(criativo_kanban)
        
        return CriativosKanbanResponse(**kanban_data)

    def get_stats(self, projeto_id: Optional[UUID] = None) -> CriativosStats:
        """Buscar estatísticas dos criativos"""
        query = self.db.query(Criativo)
        
        if projeto_id:
            query = query.filter(Criativo.projeto_id == projeto_id)
        
        # Contar total
        total = query.count()
        
        # Contar por status
        stats_query = query.with_entities(
            Criativo.status,
            func.count(Criativo.id).label('count')
        ).group_by(Criativo.status).all()
        
        # Inicializar contadores
        stats = {
            "total": total,
            "material_cru": 0,
            "em_edicao": 0,
            "aguardando_revisao": 0,
            "aprovado": 0,
            "rejeitado": 0
        }
        
        # Preencher contadores com dados reais
        for status, count in stats_query:
            stats[status.value] = count
        
        return CriativosStats(**stats)

    def get_user_stats(
        self, 
        user_id: UUID, 
        user_is_admin: bool = False, 
        projeto_id: Optional[UUID] = None
    ) -> CriativosStats:
        """Buscar estatísticas dos criativos (filtrado por usuário)"""
        if user_is_admin:
            return self.get_stats(projeto_id)
        
        # Buscar projetos acessíveis ao usuário
        accessible_projects = UserProjectService.get_user_projects(self.db, user_id)
        accessible_project_ids = [up.project_id for up in accessible_projects]
        
        # Adicionar projetos que o usuário possui
        owned_projects = self.db.query(Project).filter(Project.owner_id == user_id).all()
        accessible_project_ids.extend([p.id for p in owned_projects])
        
        # Remover duplicatas
        accessible_project_ids = list(set(accessible_project_ids))
        
        if not accessible_project_ids:
            return CriativosStats(
                total=0, material_cru=0, em_edicao=0, aguardando_revisao=0, aprovado=0, rejeitado=0
            )
        
        # Filtrar criativos apenas dos projetos acessíveis
        query = self.db.query(Criativo).filter(Criativo.projeto_id.in_(accessible_project_ids))
        
        if projeto_id and projeto_id in accessible_project_ids:
            query = query.filter(Criativo.projeto_id == projeto_id)
        
        # Contar total
        total = query.count()
        
        # Contar por status
        stats_query = query.with_entities(
            Criativo.status,
            func.count(Criativo.id).label('count')
        ).group_by(Criativo.status).all()
        
        # Inicializar contadores
        stats = {
            "total": total,
            "material_cru": 0,
            "em_edicao": 0,
            "aguardando_revisao": 0,
            "aprovado": 0,
            "rejeitado": 0
        }
        
        # Preencher contadores com dados reais
        for status, count in stats_query:
            stats[status.value] = count
        
        return CriativosStats(**stats)

    def change_status(
        self, 
        criativo_id: UUID, 
        new_status: StatusCriativo,
        user_id: UUID
    ) -> Optional[CriativoResponse]:
        """Alterar status do criativo com validação de workflow"""
        criativo = self.db.query(Criativo).filter(Criativo.id == criativo_id).first()
        
        if not criativo:
            return None
        
        # Validar transições de status (pode ser expandido com regras de negócio)
        valid_transitions = {
            StatusCriativo.MATERIAL_CRU: [StatusCriativo.EM_EDICAO],
            StatusCriativo.EM_EDICAO: [StatusCriativo.AGUARDANDO_REVISAO, StatusCriativo.MATERIAL_CRU],
            StatusCriativo.AGUARDANDO_REVISAO: [StatusCriativo.APROVADO, StatusCriativo.REJEITADO, StatusCriativo.EM_EDICAO],
            StatusCriativo.APROVADO: [StatusCriativo.EM_EDICAO],  # Permitir reabrir se necessário
            StatusCriativo.REJEITADO: [StatusCriativo.EM_EDICAO, StatusCriativo.MATERIAL_CRU]
        }
        
        current_status = criativo.status
        if new_status not in valid_transitions.get(current_status, []):
            # Se a transição não for válida, ainda permitir (pode ser necessário pular etapas)
            pass
        
        # Atualizar status
        criativo.status = new_status
        criativo.editor_id = user_id
        criativo.updated_at = datetime.utcnow()
        
        # Atualizar datas específicas
        if new_status == StatusCriativo.EM_EDICAO and not criativo.data_inicio_edicao:
            criativo.data_inicio_edicao = datetime.utcnow()
        elif new_status in [StatusCriativo.APROVADO, StatusCriativo.REJEITADO]:
            criativo.data_finalizacao = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(criativo)
        
        return CriativoResponse.from_orm_with_mapping(criativo) 