'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { ProposalCard } from '@/components/propostas/ProposalCard';
import { ProposalProgressModal } from '@/components/propostas/ProposalProgressModal';
import { TrashDropzone } from '@/components/funil-vendas/TrashDropzone';
import { Proposta } from '@/types/proposta';
import { useAuth } from '@/context/AuthContext';
import { buildApiUrl, API_CONFIG } from '@/config/api';

// Função para verificar se é um UUID válido
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export default function PropostasPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposta, setSelectedProposta] = useState<Proposta | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  // Carregar propostas da API
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchPropostas = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROPOSTAS), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
        });

        if (response.ok) {
          const data = await response.json();
          const formattedPropostas: Proposta[] = data.map((p: any) => ({
            id: p.id,
            titulo: p.titulo,
            descricao: p.descricao || '',
            status: p.status || 'em_aberto',
            progresso: p.progresso || 0,
            valor: parseFloat(p.valor) || 0,
            dataCriacao: new Date(p.data_criacao || p.created_at),
            responsavel: p.responsavel ? {
              id: p.responsavel.id,
              nome: p.responsavel.name || p.responsavel.nome,
            } : undefined,
            clienteId: p.cliente_id,
            clienteNome: p.cliente?.nome,
            observacoes: p.observacoes,
            prioridade: p.prioridade || 0,
            ordem: p.ordem || 0,
          }));
          // Ordenar por ordem (menor = maior prioridade)
          formattedPropostas.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
          setPropostas(formattedPropostas);
        }
      } catch (error) {
        console.error('Erro ao carregar propostas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPropostas();
  }, [token]);

  // Handler para drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se foi arrastado para a lixeira, excluir
    if (destination?.droppableId === 'trash') {
      await deleteProposta(draggableId);
      return;
    }

    // Se não há destino ou foi solto no mesmo lugar, cancelar
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // Reordenar propostas
    const newPropostas = Array.from(propostas);
    const [removed] = newPropostas.splice(source.index, 1);
    newPropostas.splice(destination.index, 0, removed);

    // Atualizar ordem
    const updatedPropostas = newPropostas.map((p, index) => ({
      ...p,
      ordem: index,
      prioridade: index,
    }));

    setPropostas(updatedPropostas);

    // Salvar nova ordem na API
    if (isValidUUID(draggableId)) {
      try {
        await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.PROPOSTAS}/${draggableId}`), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
          body: JSON.stringify({
            ordem: destination.index,
            prioridade: destination.index,
          }),
        });
      } catch (error) {
        console.error('Erro ao atualizar ordem da proposta:', error);
      }
    }
  };

  // Excluir proposta
  const deleteProposta = async (propostaId: string) => {
    if (!isValidUUID(propostaId)) {
      setPropostas(prev => prev.filter(p => p.id !== propostaId));
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.PROPOSTAS}/${propostaId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
      });

      if (response.ok) {
        setPropostas(prev => prev.filter(p => p.id !== propostaId));
        
        // Recarregar propostas do backend
        const refreshResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROPOSTAS), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const formattedPropostas: Proposta[] = data.map((p: any) => ({
            id: p.id,
            titulo: p.titulo,
            descricao: p.descricao || '',
            status: p.status || 'em_aberto',
            progresso: p.progresso || 0,
            valor: parseFloat(p.valor) || 0,
            dataCriacao: new Date(p.data_criacao || p.created_at),
            responsavel: p.responsavel ? {
              id: p.responsavel.id,
              nome: p.responsavel.name || p.responsavel.nome,
            } : undefined,
            clienteId: p.cliente_id,
            clienteNome: p.cliente?.nome,
            observacoes: p.observacoes,
            prioridade: p.prioridade || 0,
            ordem: p.ordem || 0,
          }));
          formattedPropostas.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
          setPropostas(formattedPropostas);
        }
      }
    } catch (error) {
      console.error('Erro ao excluir proposta:', error);
    }
  };

  // Atualizar progresso
  const handleUpdateProgress = async (propostaId: string, progresso: number) => {
    if (!isValidUUID(propostaId)) {
      setPropostas(prev => prev.map(p => p.id === propostaId ? { ...p, progresso } : p));
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.PROPOSTAS}/${propostaId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({ progresso }),
      });

      if (response.ok) {
        setPropostas(prev => prev.map(p => p.id === propostaId ? { ...p, progresso } : p));
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
    }
  };

  const handleEdit = (proposta: Proposta) => {
    // Redirecionar para página de edição ou abrir modal
    router.push(`/propostas/${proposta.id}/edit`);
  };

  const handleViewDetails = (proposta: Proposta) => {
    // Abrir modal de detalhes ou redirecionar
    setSelectedProposta(proposta);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando propostas...</p>
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Propostas</h1>
            <p className="text-muted-foreground">
              Gerencie suas propostas comerciais
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <TrashDropzone type="PROPOSTA" />
            <Button onClick={() => router.push('/propostas/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Proposta
            </Button>
          </div>
        </div>

        {/* Grid de Propostas */}
        {propostas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Nenhuma proposta encontrada</p>
            <Button onClick={() => router.push('/propostas/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Proposta
            </Button>
          </div>
        ) : (
          <Droppable droppableId="propostas-grid" type="PROPOSTA">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 rounded-lg transition-colors ${
                  snapshot.isDraggingOver ? 'bg-accent/50' : ''
                }`}
              >
                {propostas.map((proposta, index) => (
                  <ProposalCard
                    key={proposta.id}
                    proposta={proposta}
                    index={index}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
                    onDelete={deleteProposta}
                    onUpdateProgress={(id, progresso) => {
                      const proposta = propostas.find(p => p.id === id);
                      if (proposta) {
                        setSelectedProposta(proposta);
                        setIsProgressModalOpen(true);
                      }
                    }}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}

        {/* Modal de Progresso */}
        {selectedProposta && (
          <ProposalProgressModal
            proposta={selectedProposta}
            isOpen={isProgressModalOpen}
            onClose={() => {
              setIsProgressModalOpen(false);
              setSelectedProposta(null);
            }}
            onSave={(propostaId, progresso) => {
              handleUpdateProgress(propostaId, progresso);
              setIsProgressModalOpen(false);
              setSelectedProposta(null);
            }}
          />
        )}
      </div>
    </DragDropContext>
  );
}
