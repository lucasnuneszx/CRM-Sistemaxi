'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Columns, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { FunilVendasProvider, useFunilVendas } from '@/context/FunilVendasContext';
import { KanbanBoard } from '@/components/funil-vendas/KanbanBoard';
import { LeadSidebar } from '@/components/funil-vendas/LeadSidebar';
import { LeadModal } from '@/components/funil-vendas/LeadModal';
import { ColumnModal } from '@/components/funil-vendas/ColumnModal';
import { TrashDropzone } from '@/components/funil-vendas/TrashDropzone';
import { Lead, KanbanColumn } from '@/types/funil-vendas';
import { useAuth } from '@/context/AuthContext';
import { buildApiUrl, API_CONFIG } from '@/config/api';
import { toast } from 'sonner';

// Dados mockados
const mockLeads: Lead[] = [
  {
    id: '1',
    nome: 'João Silva',
    email: 'joao.silva@email.com',
    telefone: '(11) 98765-4321',
    status: 'FREE',
    tags: ['Média'],
    dataCadastro: new Date('2024-01-15'),
  },
  {
    id: '2',
    nome: 'Maria Santos',
    email: 'maria.santos@email.com',
    telefone: '(11) 98765-4322',
    status: 'FREE',
    tags: ['Alta'],
    dataCadastro: new Date('2024-01-14'),
  },
  {
    id: '3',
    nome: 'Pedro Oliveira',
    email: 'pedro.oliveira@email.com',
    telefone: '(11) 98765-4323',
    status: 'OCCUPIED',
    tags: ['Baixa'],
    dataCadastro: new Date('2024-01-13'),
  },
  {
    id: '4',
    nome: 'Ana Costa',
    email: 'ana.costa@email.com',
    telefone: '(11) 98765-4324',
    status: 'FREE',
    tags: ['Média'],
    dataCadastro: new Date('2024-01-12'),
  },
  {
    id: '5',
    nome: 'Carlos Ferreira',
    email: 'carlos.ferreira@email.com',
    telefone: '(11) 98765-4325',
    status: 'FREE',
    tags: ['Alta'],
    dataCadastro: new Date('2024-01-11'),
  },
];

const mockColumns: KanbanColumn[] = [
  {
    id: 'col-1',
    title: 'Leads que Acabaram de Cadastrar',
    order: 0,
    leads: [
      {
        id: '6',
        nome: 'Fernanda Lima',
        email: 'fernanda.lima@email.com',
        telefone: '(11) 98765-4326',
        status: 'FREE',
        tags: ['Média'],
        dataCadastro: new Date('2024-01-10'),
        columnId: 'col-1',
      },
    ],
  },
  {
    id: 'col-2',
    title: 'Leads para Renovar',
    order: 1,
    leads: [
      {
        id: '7',
        nome: 'Roberto Alves',
        email: 'roberto.alves@email.com',
        telefone: '(11) 98765-4327',
        status: 'OCCUPIED',
        tags: ['Alta'],
        dataCadastro: new Date('2024-01-09'),
        columnId: 'col-2',
      },
    ],
  },
  {
    id: 'col-3',
    title: 'Proposta',
    order: 2,
    leads: [
      {
        id: '8',
        nome: 'Juliana Martins',
        email: 'juliana.martins@email.com',
        telefone: '(11) 98765-4328',
        status: 'OCCUPIED',
        tags: ['Média'],
        dataCadastro: new Date('2024-01-08'),
        columnId: 'col-3',
      },
    ],
  },
  {
    id: 'col-4',
    title: 'Negociação',
    order: 3,
    leads: [],
  },
];

function FunilVendasContent() {
  const { token } = useAuth();
  const { state, dispatch, moveLead, addLead, updateLead, deleteLead, addColumn, updateColumn, deleteColumn } = useFunilVendas();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<KanbanColumn | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newLeadColumnId, setNewLeadColumnId] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Carregar dados da API
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [columnsResponse, leadsResponse] = await Promise.all([
          fetch(buildApiUrl(API_CONFIG.ENDPOINTS.KANBAN_COLUMNS), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch(buildApiUrl(API_CONFIG.ENDPOINTS.LEADS), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
        ]);

        if (columnsResponse.ok && leadsResponse.ok) {
          const columnsData = await columnsResponse.json();
          const leadsData = await leadsResponse.json();
          
          // Criar um mapa de colunas
          const formattedColumns: KanbanColumn[] = columnsData.map((col: any) => ({
            id: col.id,
            title: col.title,
            order: col.order || 0,
            color: col.color,
            leads: [], // Inicializar vazio, vamos preencher depois
          }));
          
          // Distribuir leads nas colunas baseado no column_id
          const leadsByColumn = new Map<string, Lead[]>();
          const backlogLeads: Lead[] = [];
          
          leadsData.forEach((lead: any) => {
            const leadFormatted: Lead = {
              id: lead.id,
              nome: lead.nome,
              email: lead.email,
              telefone: lead.telefone,
              status: lead.status,
              tags: lead.tags || [],
              dataCadastro: new Date(lead.data_cadastro || lead.created_at),
              columnId: lead.column_id ? String(lead.column_id) : undefined,
            };
            
            if (lead.column_id) {
              const columnId = String(lead.column_id);
              if (!leadsByColumn.has(columnId)) {
                leadsByColumn.set(columnId, []);
              }
              leadsByColumn.get(columnId)!.push(leadFormatted);
            } else {
              backlogLeads.push(leadFormatted);
            }
          });
          
          // Preencher colunas com seus leads
          formattedColumns.forEach(col => {
            const columnLeads = leadsByColumn.get(col.id) || [];
            col.leads = columnLeads;
          });
          
          // Ordenar colunas por order
          formattedColumns.sort((a, b) => a.order - b.order);
          
          dispatch({ type: 'SET_COLUMNS', payload: formattedColumns });
          dispatch({ type: 'SET_BACKLOG', payload: backlogLeads });
        } else {
          // Fallback: tentar carregar apenas colunas ou apenas leads
          if (columnsResponse.ok) {
            const columnsData = await columnsResponse.json();
            const formattedColumns: KanbanColumn[] = columnsData.map((col: any) => ({
              id: col.id,
              title: col.title,
              order: col.order || 0,
              color: col.color,
              leads: (col.leads || []).map((lead: any) => ({
                id: lead.id,
                nome: lead.nome,
                email: lead.email,
                telefone: lead.telefone,
                status: lead.status,
                tags: lead.tags || [],
                dataCadastro: new Date(lead.data_cadastro || lead.created_at),
                columnId: col.id,
              })),
            }));
            dispatch({ type: 'SET_COLUMNS', payload: formattedColumns });
          }
          
          if (leadsResponse.ok) {
            const leadsData = await leadsResponse.json();
            const backlogLeads: Lead[] = leadsData
              .filter((lead: any) => !lead.column_id)
              .map((lead: any) => ({
                id: lead.id,
                nome: lead.nome,
                email: lead.email,
                telefone: lead.telefone,
                status: lead.status,
                tags: lead.tags || [],
                dataCadastro: new Date(lead.data_cadastro || lead.created_at),
              }));
            dispatch({ type: 'SET_BACKLOG', payload: backlogLeads });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Fallback para dados mockados em caso de erro
        if (state.columns.length === 0 && state.backlog.length === 0) {
          dispatch({ type: 'SET_COLUMNS', payload: mockColumns });
          dispatch({ type: 'SET_BACKLOG', payload: mockLeads });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se foi arrastado para a lixeira, excluir
    if (destination?.droppableId === 'trash') {
      await deleteLeadFromAPI(draggableId);
      return;
    }

    // Se não há destino, cancelar
    if (!destination) return;

    // Se o item foi solto no mesmo lugar, não fazer nada
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Determinar origem
    const fromColumnId = source.droppableId === 'backlog' ? null : source.droppableId;

    // Determinar destino
    const toColumnId = destination.droppableId === 'backlog' ? null : destination.droppableId;

    // Mover lead localmente primeiro
    moveLead(draggableId, fromColumnId, toColumnId || 'backlog', destination.index);

    // Salvar na API apenas se for um UUID válido
    if (isValidUUID(draggableId)) {
      try {
        const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.LEADS}/${draggableId}/move`), {
          method: 'PATCH', // Mudado de POST para PATCH
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            column_id: toColumnId || null,
            new_index: destination.index,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
          console.error('Erro ao mover lead na API:', errorData);
          toast.error('Erro ao mover lead', {
            description: errorData.detail || 'Não foi possível salvar a posição do lead'
          });
          // Reverter movimento local em caso de erro
          moveLead(draggableId, toColumnId || 'backlog', fromColumnId || 'backlog', source.index);
        } else {
          const updatedLead = await response.json();
          // Atualizar o lead localmente com os dados atualizados do servidor
          if (updatedLead) {
            // O lead já foi movido localmente, apenas garantir que está sincronizado
          }
        }
      } catch (error) {
        console.error('Erro ao mover lead:', error);
        toast.error('Erro ao mover lead', {
          description: 'Não foi possível conectar ao servidor'
        });
        // Reverter movimento local em caso de erro
        moveLead(draggableId, toColumnId || 'backlog', fromColumnId || 'backlog', source.index);
      }
    }
  };

  // Função para verificar se é um UUID válido
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const deleteLeadFromAPI = async (leadId: string) => {
    // Se não for um UUID válido, é um dado mockado - apenas remover do estado local
    if (!isValidUUID(leadId)) {
      deleteLead(leadId);
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.LEADS}/${leadId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        deleteLead(leadId);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
        console.error('Erro ao excluir lead:', errorData);
        alert(`Erro ao excluir lead: ${errorData.detail || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
      alert('Erro ao excluir lead. Verifique sua conexão.');
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
  };

  const handleAddLead = (columnId?: string) => {
    setNewLeadColumnId(columnId);
    setSelectedLead(null);
    setIsLeadModalOpen(true);
  };

  const handleSaveLead = async (lead: Lead) => {
    try {
      if (selectedLead) {
        // Atualizar lead existente
        const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.LEADS}/${lead.id}`), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome: lead.nome,
            email: lead.email,
            telefone: lead.telefone,
            status: lead.status,
            tags: lead.tags,
            observacoes: lead.observacoes,
            column_id: lead.columnId || null,
          }),
        });

        if (response.ok) {
          const updatedLead = await response.json();
          updateLead(lead.id, {
            ...lead,
            id: updatedLead.id,
            dataCadastro: new Date(updatedLead.data_cadastro),
          });
        }
      } else {
        // Criar novo lead
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.LEADS), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome: lead.nome,
            email: lead.email,
            telefone: lead.telefone,
            status: lead.status || 'FREE',
            tags: lead.tags || [],
            observacoes: lead.observacoes,
            data_cadastro: new Date().toISOString(),
            column_id: newLeadColumnId || null,
          }),
        });

        if (response.ok) {
          const newLead = await response.json();
          addLead({
            ...lead,
            id: newLead.id,
            dataCadastro: new Date(newLead.data_cadastro),
          }, newLeadColumnId);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      alert('Erro ao salvar lead');
    }
    setNewLeadColumnId(undefined);
  };

  const handleDeleteLead = async (leadId: string) => {
    await deleteLeadFromAPI(leadId);
  };

  const handleAddColumn = () => {
    setSelectedColumn(null);
    setIsColumnModalOpen(true);
  };

  const handleEditColumn = (column: KanbanColumn) => {
    setSelectedColumn(column);
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = async (column: KanbanColumn) => {
    try {
      if (selectedColumn) {
        // Atualizar coluna existente
        const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.KANBAN_COLUMNS}/${column.id}`), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: column.title,
            order: column.order,
            color: column.color,
          }),
        });

        if (response.ok) {
          updateColumn(column.id, column);
        }
      } else {
        // Criar nova coluna
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.KANBAN_COLUMNS), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: column.title,
            order: column.order || state.columns.length,
            color: column.color,
          }),
        });

        if (response.ok) {
          const newColumn = await response.json();
          addColumn({
            ...column,
            id: newColumn.id,
            leads: [],
          });
        }
      }
    } catch (error) {
      console.error('Erro ao salvar coluna:', error);
      alert('Erro ao salvar coluna');
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.KANBAN_COLUMNS}/${columnId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        deleteColumn(columnId);
      } else {
        console.error('Erro ao excluir coluna');
        alert('Erro ao excluir coluna');
      }
    } catch (error) {
      console.error('Erro ao excluir coluna:', error);
      alert('Erro ao excluir coluna');
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Funil de Vendas</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seus leads e acompanhe o progresso das vendas
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <TrashDropzone />
            <Button onClick={handleAddColumn} variant="outline">
              <Columns className="h-4 w-4 mr-2" />
              + Coluna
            </Button>
            <Button onClick={() => handleAddLead()}>
              <Plus className="h-4 w-4 mr-2" />
              + Novo Atendimento
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-8 w-6 self-center rounded-md border border-border bg-background hover:bg-accent flex items-center justify-center transition-all shrink-0"
            aria-label={isSidebarOpen ? 'Fechar sidebar' : 'Abrir sidebar'}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {/* Sidebar */}
          {isSidebarOpen && (
            <div className="h-full transition-all">
              <LeadSidebar
                leads={state.backlog}
                onLeadClick={handleLeadClick}
              />
            </div>
          )}

          {/* Kanban Board */}
          <div className="flex-1 overflow-hidden min-h-0">
            <KanbanBoard
              onLeadClick={handleLeadClick}
              onAddLead={handleAddLead}
              onEditColumn={handleEditColumn}
              onDeleteColumn={handleDeleteColumn}
            />
          </div>
        </div>

        {/* Modals */}
        <LeadModal
          lead={selectedLead}
          isOpen={isLeadModalOpen}
          onClose={() => {
            setIsLeadModalOpen(false);
            setSelectedLead(null);
            setNewLeadColumnId(undefined);
          }}
          onSave={handleSaveLead}
          onDelete={selectedLead ? handleDeleteLead : undefined}
        />

        <ColumnModal
          column={selectedColumn}
          isOpen={isColumnModalOpen}
          onClose={() => {
            setIsColumnModalOpen(false);
            setSelectedColumn(null);
          }}
          onSave={handleSaveColumn}
        />
      </div>
    </DragDropContext>
  );
}

export default function FunilVendasPage() {
  return (
    <FunilVendasProvider>
      <FunilVendasContent />
    </FunilVendasProvider>
  );
}

