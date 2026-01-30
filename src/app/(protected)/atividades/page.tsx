'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { 
  Plus, 
  Pencil, 
  Trash, 
  Loader2, 
  CalendarClock, 
  Search,
  LayoutGrid,
  List,
  Calendar,
  Target,
  AlertTriangle,
  Circle,
  CheckCircle2,
  PlayCircle,
  XCircle,
  MoreHorizontal,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from '@/config/api';

interface Atividade {
  id: string;
  nome: string;
  descricao?: string;
  status: string;
  prazo?: string;
  dataInicio?: string;
  dataFim?: string;
  data_inicio?: string;
  data_fim?: string;
  percentual_conclusao?: number;
  prioridade: string;
  projetoId: string;
  responsavelId?: string;
  setorId?: string;
  createdAt: string;
  updatedAt: string;
  projeto: {
    id: string;
    name: string;
  };
  responsavel?: {
    id: string;
    username: string;
    email: string;
  };
  setor?: {
    id: string;
    nome: string;
  };
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  icon: React.ReactNode;
  atividades: Atividade[];
}

export default function AtividadesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingAdd, setLoadingAdd] = useState(false);

  
  // Estados para filtros e visualização
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'calendar'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterResponsavel, setFilterResponsavel] = useState<string>('all');
  
  // Estados para salvamento automático
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [errorItems, setErrorItems] = useState<Set<string>>(new Set());

  // Estados para seções expandidas por setor
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());

  // Estados para usuários disponíveis
  const [usuarios, setUsuarios] = useState<{ id: string; name: string; email: string }[]>([]);

  // Estados para criação rápida inline
  const [showQuickCreate, setShowQuickCreate] = useState<string | null>(null);
  const [quickCreateData, setQuickCreateData] = useState({
    nome: '',
    status: 'Não iniciada',
    prioridade: 'Média',
    responsavelId: 'unassigned',
    setorId: '',
    projetoId: 'none'
  });
  const [creatingActivity, setCreatingActivity] = useState(false);

  // Lista de projetos disponíveis
  const [projetos, setProjetos] = useState<{ id: string; name: string }[]>([]);

  // Função universal para atualizar atividade
  const updateAtividade = async (id: string, field: string, value: string | number | null, oldValue: string | number | null) => {
    // Adicionar ao estado de salvamento
    setSavingItems(prev => new Set([...prev, `${id}-${field}`]));
    setSavedItems(prev => {
      const newSet = new Set([...prev]);
      newSet.delete(`${id}-${field}`);
      return newSet;
    });
    setErrorItems(prev => {
      const newSet = new Set([...prev]);
      newSet.delete(`${id}-${field}`);
      return newSet;
    });

    // Atualizar localmente primeiro (optimistic update)
    setAtividades(prev => 
      prev.map(atividade => 
        atividade.id === id ? { ...atividade, [field]: value } : atividade
      )
    );

    try {
      console.log(`Debug - Tentando atualizar ${field} para:`, value);
      console.log(`Debug - ID da atividade:`, id);
      console.log(`Debug - Token disponível:`, !!token);
      
      const requestBody = { [field]: value };
      console.log(`Debug - Body da requisição:`, requestBody);
      
      const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITIES_OLD)}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`Debug - Status da resposta:`, response.status);
      console.log(`Debug - Status text:`, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Debug - Erro da API:`, errorText);
        throw new Error(`Falha ao atualizar ${field}: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Sucesso: remover de saving e adicionar a saved
      setSavingItems(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(`${id}-${field}`);
        return newSet;
      });
      
      setSavedItems(prev => new Set([...prev, `${id}-${field}`]));

      // Remover indicador de sucesso após 2 segundos
      setTimeout(() => {
        setSavedItems(prev => {
          const newSet = new Set([...prev]);
          newSet.delete(`${id}-${field}`);
          return newSet;
        });
      }, 2000);

    } catch (err) {
      console.error(`Erro ao atualizar ${field}:`, err);
      
      // Reverter mudança local em caso de erro
      setAtividades(prev => 
        prev.map(atividade => 
          atividade.id === id ? { ...atividade, [field]: oldValue } : atividade
        )
      );

      // Adicionar ao estado de erro
      setSavingItems(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(`${id}-${field}`);
        return newSet;
      });
      
      setErrorItems(prev => new Set([...prev, `${id}-${field}`]));

      // Remover indicador de erro após 5 segundos
      setTimeout(() => {
        setErrorItems(prev => {
          const newSet = new Set([...prev]);
          newSet.delete(`${id}-${field}`);
          return newSet;
        });
      }, 5000);
    }
  };

  // Função para obter ícone de status de salvamento
  const getSaveStatusIcon = (atividadeId: string, field: string) => {
    const key = `${atividadeId}-${field}`;
    
    if (savingItems.has(key)) {
      return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
    }
    
    if (savedItems.has(key)) {
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    }
    
    if (errorItems.has(key)) {
      return <XCircle className="h-3 w-3 text-red-500" />;
    }
    
    return null;
  };

  // Colunas do Kanban
  const getKanbanColumns = (): KanbanColumn[] => {
    const statusColumns: KanbanColumn[] = [
      {
        id: 'nao-iniciada',
        title: 'Não iniciada',
        color: 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700',
        icon: <Circle className="h-4 w-4 text-gray-500 dark:text-gray-400" />,
        atividades: []
      },
      {
        id: 'em-andamento',
        title: 'Em andamento',
        color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
        icon: <PlayCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />,
        atividades: []
      },
      {
        id: 'concluida',
        title: 'Concluída',
        color: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
        icon: <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />,
        atividades: []
      },
      {
        id: 'atrasada',
        title: 'Atrasada',
        color: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
        icon: <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />,
        atividades: []
      }
    ];

    // Distribuir atividades nas colunas
    const filteredAtividades = getFilteredAtividades();
    
    filteredAtividades.forEach(atividade => {
      const status = atividade.status.toLowerCase().replace(' ', '-');
      const column = statusColumns.find(col => col.id === status);
      if (column) {
        column.atividades.push(atividade);
      } else {
        // Se não encontrar, adiciona na primeira coluna
        statusColumns[0].atividades.push(atividade);
      }
    });

    return statusColumns;
  };

  useEffect(() => {
    const fetchAtividades = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITIES_OLD)}?include=responsavel,setor,projeto`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar atividades');
        }

        const data = await response.json();
        setAtividades(data);
      } catch (err) {
        console.error('Erro:', err);
        setError('Não foi possível carregar as atividades. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    const fetchUsuarios = async () => {
      try {
        const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.USERS)}/for-assignment`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar usuários');
        }

        const data = await response.json();
        setUsuarios(data.map((user: { id: string; name?: string; username?: string; email: string }) => ({
          id: user.id,
          name: user.name || user.username || user.email,
          email: user.email
        })));
      } catch (err) {
        console.error('Erro ao carregar usuários:', err);
      }
    };

    const fetchProjetos = async () => {
      try {
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar projetos');
        }

        const data = await response.json();
        setProjetos(data.map((projeto: { id: string; name: string }) => ({
          id: projeto.id,
          name: projeto.name
        })));
      } catch (err) {
        console.error('Erro ao carregar projetos:', err);
      }
    };

    if (token) {
      fetchAtividades();
      fetchUsuarios();
      fetchProjetos();
    }
  }, [token]);

  // Filtros
  const getFilteredAtividades = () => {
    return atividades.filter(atividade => {
      const matchesSearch = atividade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           atividade.projeto.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = filterProject === 'all' || atividade.projetoId === filterProject;
      const matchesPriority = filterPriority === 'all' || atividade.prioridade === filterPriority;
      const matchesResponsavel = filterResponsavel === 'all' || atividade.responsavelId === filterResponsavel;

      return matchesSearch && matchesProject && matchesPriority && matchesResponsavel;
    });
  };

  // Drag and Drop
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    // Mapear ID da coluna para status
    const statusMap: { [key: string]: string } = {
      'nao-iniciada': 'Não iniciada',
      'em-andamento': 'Em andamento',
      'concluida': 'Concluída',
      'atrasada': 'Atrasada'
    };

    const newStatus = statusMap[destination.droppableId];
    if (!newStatus) return;

    // Encontrar a atividade para obter o status atual
    const atividade = atividades.find(a => a.id === draggableId);
    if (!atividade) return;

    // Usar a função universal de atualização
    updateAtividade(draggableId, 'status', newStatus, atividade.status);
  };

  const handleAddNew = () => {
    setLoadingAdd(true);
    router.push('/atividades/new');
  };

  const handleEdit = (id: string) => {
    router.push(`/atividades/${id}/edit`);
  };

  const handleView = (id: string) => {
    router.push(`/atividades/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) {
      return;
    }
    
    try {
      const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITIES_OLD)}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir atividade');
      }

      setAtividades(atividades.filter(atividade => atividade.id !== id));
    } catch (err) {
      console.error('Erro:', err);
      setError('Falha ao excluir atividade');
    }
  };

  // Função para formatar data
  const formatarData = (dataString?: string) => {
    if (!dataString) return '-';
    return format(new Date(dataString), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Função para retornar cor da prioridade
  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade.toLowerCase()) {
      case 'alta':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'urgente':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'baixa':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  // Função para obter ícone da prioridade
  const getPrioridadeIcon = (prioridade: string) => {
    switch (prioridade.toLowerCase()) {
      case 'urgente':
        return <AlertTriangle className="h-3 w-3" />;
      case 'alta':
        return <Target className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Função para obter iniciais do nome
  const getInitials = (name?: string) => {
    if (!name || typeof name !== 'string') return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Função para agrupar atividades por setor
  const getAtividadesPorSetor = () => {
    const atividadesFiltradas = getFilteredAtividades();
    const grupos: { [key: string]: { setor: { id: string; nome: string } | null; atividades: Atividade[] } } = {};

    atividadesFiltradas.forEach(atividade => {
      const setorKey = atividade.setor?.id || 'sem-setor';
      
      if (!grupos[setorKey]) {
        grupos[setorKey] = {
          setor: atividade.setor || { id: 'sem-setor', nome: 'Sem Setor' },
          atividades: []
        };
      }
      grupos[setorKey].atividades.push(atividade);
    });

    return Object.values(grupos).sort((a, b) => {
      if (a.setor?.nome === 'Sem Setor') return 1;
      if (b.setor?.nome === 'Sem Setor') return -1;
      return (a.setor?.nome || '').localeCompare(b.setor?.nome || '');
    });
  };

  // Função para alternar seção expandida
  const toggleSector = (setorId: string) => {
    setExpandedSectors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(setorId)) {
        newSet.delete(setorId);
      } else {
        newSet.add(setorId);
      }
      return newSet;
    });
  };

  // Inicializar com todos os setores expandidos
  useEffect(() => {
    const setores = getAtividadesPorSetor();
    setExpandedSectors(new Set(setores.map(grupo => grupo.setor?.id || 'sem-setor')));
  }, [atividades]);

  // Funções para criação rápida
  const handleShowQuickCreate = (setorId: string) => {
    setShowQuickCreate(setorId);
    setQuickCreateData({
      nome: '',
      status: 'Não iniciada',
      prioridade: 'Média',
      responsavelId: 'unassigned',
      setorId: setorId,
      projetoId: 'none'
    });
  };

  const handleCancelQuickCreate = () => {
    setShowQuickCreate(null);
    setQuickCreateData({
      nome: '',
      status: 'Não iniciada',
      prioridade: 'Média',
      responsavelId: 'unassigned',
      setorId: '',
      projetoId: 'none'
    });
  };

  const handleCreateActivity = async () => {
    if (!quickCreateData.nome.trim()) {
      return;
    }

    setCreatingActivity(true);
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITIES_OLD), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: quickCreateData.nome,
          status: quickCreateData.status,
          prioridade: quickCreateData.prioridade,
          responsavelId: quickCreateData.responsavelId === 'unassigned' ? null : quickCreateData.responsavelId || null,
          // setorId será atribuído automaticamente pelo backend baseado no setor do usuário logado
          projetoId: quickCreateData.projetoId !== 'none' ? quickCreateData.projetoId : null
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao criar atividade');
      }

      const novaAtividade = await response.json();
      setAtividades(prev => [novaAtividade, ...prev]);
      handleCancelQuickCreate();
    } catch (err) {
      console.error('Erro ao criar atividade:', err);
      setError('Falha ao criar atividade');
    } finally {
      setCreatingActivity(false);
    }
  };

  // Renderizar Card da Atividade
  const renderAtividadeCard = (atividade: Atividade, index: number) => {
    const getBorderColor = (prioridade: string) => {
      switch (prioridade.toLowerCase()) {
        case 'urgente': return 'border-l-red-500';
        case 'alta': return 'border-l-orange-500';
        case 'média': return 'border-l-yellow-500';
        case 'baixa': return 'border-l-green-500';
        default: return 'border-l-blue-500';
      }
    };

    return (
      <Draggable key={atividade.id} draggableId={atividade.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`mb-3 ${snapshot.isDragging ? 'rotate-3 shadow-lg scale-105' : ''}`}
          >
            <Card className={`cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 ${getBorderColor(atividade.prioridade)} dark:bg-gray-800 bg-white`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm line-clamp-2 flex-1 mr-2 dark:text-white">
                    {atividade.nome}
                  </h4>
                  <div className="flex items-center gap-1">
                    {getPrioridadeIcon(atividade.prioridade)}
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge className={getPrioridadeColor(atividade.prioridade)} variant="outline">
                    {atividade.prioridade}
                  </Badge>
                  <Badge variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-200">
                    {atividade.projeto.name}
                  </Badge>
                </div>

                {/* Datas */}
                <div className="space-y-1 mb-3">
                  {(atividade.data_inicio || atividade.dataInicio) && (
                    <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <CalendarClock className="h-3 w-3 mr-1" />
                      <span className="font-medium">Início:</span>
                      <span className="ml-1">{formatarData(atividade.data_inicio || atividade.dataInicio)}</span>
                    </div>
                  )}
                  
                  {(atividade.data_fim || atividade.dataFim) && (
                    <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                      <CalendarClock className="h-3 w-3 mr-1" />
                      <span className="font-medium">Vencimento:</span>
                      <span className="ml-1">{formatarData(atividade.data_fim || atividade.dataFim)}</span>
                    </div>
                  )}

                  {atividade.prazo && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <CalendarClock className="h-3 w-3 mr-1" />
                      <span className="font-medium">Prazo:</span>
                      <span className="ml-1">{formatarData(atividade.prazo)}</span>
                    </div>
                  )}
                </div>

                {/* Barra de Progresso */}
                {(atividade.percentual_conclusao !== undefined && atividade.percentual_conclusao !== null) && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Progresso</span>
                      <span className="text-xs font-medium">{atividade.percentual_conclusao}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${atividade.percentual_conclusao}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {atividade.responsavel && (
                      <div className="flex items-center gap-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            {getInitials(atividade.responsavel.username)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {atividade.responsavel.username}
                        </span>
                      </div>
                    )}
                    {atividade.setor && (
                      <Badge variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-200">
                        {atividade.setor.nome}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleView(atividade.id)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleEdit(atividade.id)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Atividades</h1>
          {/* Indicador de salvamento geral */}
          {savingItems.size > 0 && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Salvando {savingItems.size} item{savingItems.size > 1 ? 's' : ''}...</span>
            </div>
          )}
          {savedItems.size > 0 && savingItems.size === 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Salvo!</span>
            </div>
          )}
          {errorItems.size > 0 && savingItems.size === 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              <span>Erro ao salvar {errorItems.size} item{errorItems.size > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <Button onClick={handleAddNew} disabled={loadingAdd}>
          {loadingAdd ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Nova Atividade
        </Button>
      </div>

      {/* Filtros e Controles */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Barra de Pesquisa */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar atividades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Projetos</SelectItem>
                  {projetos.map((projeto, index) => (
                    <SelectItem key={`projeto-${projeto.id}-${index}`} value={projeto.id}>
                      {projeto.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterResponsavel} onValueChange={setFilterResponsavel}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Modos de Visualização */}
            <div className="flex gap-1 ml-auto">
              <Button
                variant={viewMode === 'board' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('board')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Carregando atividades...</p>
        </div>
      ) : (
        <div className="w-full">
          {/* Kanban Board View */}
          {viewMode === 'board' && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {getKanbanColumns().map((column) => (
                  <div key={column.id} className={`rounded-lg border-2 ${column.color} p-4`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {column.icon}
                        <h3 className="font-semibold text-sm">{column.title}</h3>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {column.atividades.length}
                      </Badge>
                    </div>
                    
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[200px] ${snapshot.isDraggingOver ? 'bg-muted/50' : ''} rounded-md transition-colors`}
                        >
                          {column.atividades.map((atividade, index) => 
                            renderAtividadeCard(atividade, index)
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
          )}

          {/* List View - Estilo ClickUp */}
          {viewMode === 'list' && (
            <div className="space-y-1">
              {/* Header da Lista */}
              <div className="bg-muted/50 dark:bg-gray-800/50 p-3 rounded-lg border">
                <div className="grid grid-cols-16 gap-4 text-sm font-medium text-muted-foreground">
                  <div className="col-span-3">Nome da Atividade</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Prioridade</div>
                  <div className="col-span-2">Responsável</div>
                  <div className="col-span-2">Data Inicial</div>
                  <div className="col-span-2">Data Vencimento</div>
                  <div className="col-span-2">Prazo</div>
                  <div className="col-span-1">% Done</div>
                  <div className="col-span-1 text-right">Ações</div>
                </div>
              </div>

              {/* Lista de Atividades */}
              <div className="space-y-1">
                {getAtividadesPorSetor().length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-semibold mb-2">Nenhuma atividade encontrada</h3>
                    <p className="text-sm">Tente ajustar os filtros ou criar uma nova atividade</p>
                  </div>
                ) : (
                  getAtividadesPorSetor().map((grupo) => (
                    <Collapsible
                      key={grupo.setor?.id || 'sem-setor'}
                      open={expandedSectors.has(grupo.setor?.id || 'sem-setor')}
                      onOpenChange={() => toggleSector(grupo.setor?.id || 'sem-setor')}
                    >
                      {/* Cabeçalho do Setor */}
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-lg border transition-colors">
                          <div className="flex items-center gap-3">
                            {expandedSectors.has(grupo.setor?.id || 'sem-setor') ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              <h3 className="font-semibold text-left">
                                {grupo.setor?.nome || 'Sem Setor'}
                              </h3>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {grupo.atividades.length} {grupo.atividades.length === 1 ? 'atividade' : 'atividades'}
                            </Badge>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      {/* Atividades do Setor */}
                      <CollapsibleContent className="space-y-1 mt-1">
                        {/* Formulário de criação rápida */}
                        {showQuickCreate === (grupo.setor?.id || 'sem-setor') ? (
                          <div className="group bg-blue-50 dark:bg-blue-900/20 p-3 ml-6 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                            <div className="grid grid-cols-16 gap-4 items-center">
                              {/* Nome da Atividade */}
                              <div className="col-span-3">
                                <Input
                                  placeholder="Nome da atividade..."
                                  value={quickCreateData.nome}
                                  onChange={(e) => setQuickCreateData(prev => ({ ...prev, nome: e.target.value }))}
                                  className="h-8 text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleCreateActivity();
                                    } else if (e.key === 'Escape') {
                                      handleCancelQuickCreate();
                                    }
                                  }}
                                />
                              </div>

                              {/* Status */}
                              <div className="col-span-2">
                                <Select 
                                  value={quickCreateData.status} 
                                  onValueChange={(value) => setQuickCreateData(prev => ({ ...prev, status: value }))}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Não iniciada">Não iniciada</SelectItem>
                                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                                    <SelectItem value="Concluída">Concluída</SelectItem>
                                    <SelectItem value="Atrasada">Atrasada</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Prioridade */}
                              <div className="col-span-1">
                                <Select 
                                  value={quickCreateData.prioridade} 
                                  onValueChange={(value) => setQuickCreateData(prev => ({ ...prev, prioridade: value }))}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Baixa">Baixa</SelectItem>
                                    <SelectItem value="Média">Média</SelectItem>
                                    <SelectItem value="Alta">Alta</SelectItem>
                                    <SelectItem value="Urgente">Urgente</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Responsável */}
                              <div className="col-span-2">
                                <Select 
                                  value={quickCreateData.responsavelId} 
                                  onValueChange={(value) => setQuickCreateData(prev => ({ ...prev, responsavelId: value }))}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Selecionar..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unassigned">Não atribuído</SelectItem>
                                    {usuarios.map((usuario) => (
                                      <SelectItem key={usuario.id} value={usuario.id}>
                                        {usuario.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Projeto */}
                              <div className="col-span-2">
                                <Select 
                                  value={quickCreateData.projetoId} 
                                  onValueChange={(value) => setQuickCreateData(prev => ({ ...prev, projetoId: value }))}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Selecionar..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Nenhum</SelectItem>
                                    {projetos.map((projeto) => (
                                      <SelectItem key={projeto.id} value={projeto.id}>
                                        {projeto.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Campos vazios para alinhar com a estrutura */}
                              <div className="col-span-4"></div>

                              {/* Ações */}
                              <div className="col-span-2">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={handleCreateActivity}
                                    disabled={!quickCreateData.nome.trim() || creatingActivity}
                                    className="h-7"
                                  >
                                    {creatingActivity ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      'Salvar'
                                    )}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={handleCancelQuickCreate}
                                    disabled={creatingActivity}
                                    className="h-7"
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="ml-6 mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShowQuickCreate(grupo.setor?.id || 'sem-setor')}
                              className="w-full h-8 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50 text-muted-foreground hover:text-primary transition-all"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar atividade
                            </Button>
                          </div>
                        )}
                        
                        {grupo.atividades.map((atividade) => (
                          <div
                            key={atividade.id}
                            className="group bg-card hover:bg-muted/50 dark:hover:bg-gray-800/50 p-3 ml-6 rounded-lg border transition-all duration-200 hover:shadow-sm"
                          >
                            <div className="grid grid-cols-16 gap-4 items-center">
                              {/* Nome da Atividade */}
                              <div className="col-span-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-1 h-8 rounded-full ${
                                    atividade.prioridade === 'Urgente' ? 'bg-red-500' :
                                    atividade.prioridade === 'Alta' ? 'bg-orange-500' :
                                    atividade.prioridade === 'Média' ? 'bg-yellow-500' : 'bg-green-500'
                                  }`} />
                                  <div>
                                    <h4 className="font-medium text-sm hover:text-primary cursor-pointer transition-colors">
                                      {atividade.nome}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {atividade.projeto.name}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Status */}
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <Select 
                                    value={atividade.status} 
                                    onValueChange={(newStatus) => {
                                      updateAtividade(atividade.id, 'status', newStatus, atividade.status);
                                    }}
                                  >
                                    <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-muted">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Não iniciada">
                                        <div className="flex items-center gap-2">
                                          <Circle className="h-3 w-3 text-gray-500" />
                                          Não iniciada
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="Em andamento">
                                        <div className="flex items-center gap-2">
                                          <PlayCircle className="h-3 w-3 text-blue-500" />
                                          Em andamento
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="Concluída">
                                        <div className="flex items-center gap-2">
                                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                                          Concluída
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="Atrasada">
                                        <div className="flex items-center gap-2">
                                          <XCircle className="h-3 w-3 text-red-500" />
                                          Atrasada
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {getSaveStatusIcon(atividade.id, 'status')}
                                </div>
                              </div>

                              {/* Prioridade */}
                              <div className="col-span-1">
                                <div className="flex items-center gap-2">
                                  <Select 
                                    value={atividade.prioridade} 
                                    onValueChange={(newPrioridade) => {
                                      updateAtividade(atividade.id, 'prioridade', newPrioridade, atividade.prioridade);
                                    }}
                                  >
                                    <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-muted">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Baixa">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-green-500" />
                                          Baixa
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="Média">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                          Média
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="Alta">
                                        <div className="flex items-center gap-2">
                                          <Target className="h-3 w-3 text-orange-500" />
                                          Alta
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="Urgente">
                                        <div className="flex items-center gap-2">
                                          <AlertTriangle className="h-3 w-3 text-red-500" />
                                          Urgente
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {getSaveStatusIcon(atividade.id, 'prioridade')}
                                </div>
                              </div>

                              {/* Responsável */}
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <Select 
                                    value={atividade.responsavelId || 'unassigned'} 
                                    onValueChange={(newResponsavelId) => {
                                      updateAtividade(atividade.id, 'responsavelId', newResponsavelId === 'unassigned' ? null : newResponsavelId, atividade.responsavelId || null);
                                    }}
                                  >
                                    <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-muted">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unassigned">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-4 w-4">
                                            <AvatarFallback className="text-xs bg-gray-400 text-white">
                                              ?
                                            </AvatarFallback>
                                          </Avatar>
                                          Não atribuído
                                        </div>
                                      </SelectItem>
                                      {usuarios.map((usuario) => (
                                        <SelectItem key={usuario.id} value={usuario.id}>
                                          <div className="flex items-center gap-2">
                                            <Avatar className="h-4 w-4">
                                              <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                                {getInitials(usuario.name)}
                                              </AvatarFallback>
                                            </Avatar>
                                            {usuario.name}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {getSaveStatusIcon(atividade.id, 'responsavelId')}
                                </div>
                              </div>

                              {/* Data Inicial */}
                              <div className="col-span-2">
                                {(atividade.data_inicio || atividade.dataInicio) ? (
                                  <div className="flex items-center gap-1">
                                    <CalendarClock className="h-3 w-3 text-green-600" />
                                    <span className="text-xs">
                                      {formatarData(atividade.data_inicio || atividade.dataInicio)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Não definida</span>
                                )}
                              </div>

                              {/* Data Vencimento */}
                              <div className="col-span-2">
                                {(atividade.data_fim || atividade.dataFim) ? (
                                  <div className="flex items-center gap-1">
                                    <CalendarClock className="h-3 w-3 text-red-600" />
                                    <span className="text-xs">
                                      {formatarData(atividade.data_fim || atividade.dataFim)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Não definida</span>
                                )}
                              </div>

                              {/* Prazo */}
                              <div className="col-span-2">
                                {atividade.prazo ? (
                                  <div className="flex items-center gap-1">
                                    <CalendarClock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {formatarData(atividade.prazo)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </div>

                              {/* % Done */}
                              <div className="col-span-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                      <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                        style={{ width: `${atividade.percentual_conclusao || 0}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <span className="text-xs font-medium min-w-[30px]">
                                    {atividade.percentual_conclusao || 0}%
                                  </span>
                                </div>
                              </div>

                              {/* Ações */}
                              <div className="col-span-1">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleView(atividade.id)}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(atividade.id)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600" 
                                    onClick={() => handleDelete(atividade.id)}
                                  >
                                    <Trash className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Botão para adicionar nova atividade no final da lista */}
                        {!showQuickCreate && grupo.atividades.length > 0 && (
                          <div className="ml-6 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShowQuickCreate(grupo.setor?.id || 'sem-setor')}
                              className="w-full h-8 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50 text-muted-foreground hover:text-primary transition-all"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar atividade
                            </Button>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Calendar View - Placeholder */}
          {viewMode === 'calendar' && (
            <Card>
              <CardContent className="p-8">
                <div className="text-center text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Visualização de Calendário</h3>
                  <p>Esta funcionalidade será implementada em breve.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 