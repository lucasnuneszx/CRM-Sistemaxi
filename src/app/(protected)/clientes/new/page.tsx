'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, X, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LeadSidebarSimple } from '@/components/funil-vendas/LeadSidebarSimple';
import { FunilVendasProvider, useFunilVendas } from '@/context/FunilVendasContext';
import { Lead } from '@/types/funil-vendas';
import { useAuth } from '@/context/AuthContext';
import { buildApiUrl, API_CONFIG } from '@/config/api';
import { toast } from 'sonner';

// Schema de validação simplificado
const clienteSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  empreendimento: z.string().optional(),
  origemLead: z.string().optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;


function NovoClienteContent() {
  const router = useRouter();
  const { token } = useAuth();
  const { state, dispatch } = useFunilVendas();
  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [allLeads, setAllLeads] = useState<Lead[]>([]); // Estado local para todos os leads

  // Carregar leads da API ao montar o componente
  useEffect(() => {
    if (!token) return;

    const fetchLeads = async () => {
      try {
        setLoadingLeads(true);
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.LEADS), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar leads');
        }

        const leadsData: any[] = await response.json();
        
        // Converter leads da API para o formato esperado
        const formattedLeads: Lead[] = leadsData.map((lead: any) => ({
          id: String(lead.id),
          nome: lead.nome,
          email: lead.email || '',
          telefone: lead.telefone || '',
          status: lead.status || 'FREE',
          tags: lead.tags || [],
          dataCadastro: new Date(lead.data_cadastro || lead.created_at || Date.now()),
          columnId: lead.column_id ? String(lead.column_id) : undefined,
        }));

        // IMPORTANTE: Salvar TODOS os leads no estado local para exibir na sidebar
        // Independente de terem columnId ou não
        setAllLeads(formattedLeads);

        // Separar leads em backlog (sem columnId) e por coluna para o contexto
        const backlogLeads = formattedLeads.filter(lead => !lead.columnId);
        const leadsByColumn = new Map<string, Lead[]>();

        formattedLeads.forEach(lead => {
          if (lead.columnId) {
            if (!leadsByColumn.has(lead.columnId)) {
              leadsByColumn.set(lead.columnId, []);
            }
            leadsByColumn.get(lead.columnId)!.push(lead);
          }
        });

        // Atualizar estado do contexto
        dispatch({ type: 'SET_BACKLOG', payload: backlogLeads });
        
        // Se houver colunas no estado, atualizar os leads delas
        if (state.columns.length > 0) {
          const updatedColumns = state.columns.map(col => ({
            ...col,
            leads: leadsByColumn.get(col.id) || [],
          }));
          dispatch({ type: 'SET_COLUMNS', payload: updatedColumns });
        }
      } catch (error) {
        console.error('Erro ao carregar leads:', error);
        toast.error('Erro ao carregar leads', {
          description: 'Não foi possível carregar a lista de leads'
        });
      } finally {
        setLoadingLeads(false);
      }
    };

    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      empreendimento: '',
      origemLead: '',
    },
  });

  // Preencher formulário quando um lead for selecionado
  const handleLeadClick = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    
    // Preencher campos do formulário
    setValue('nome', lead.nome);
    
    // Se o lead tem tags, usar a primeira como origem
    if (lead.tags && lead.tags.length > 0) {
      setValue('origemLead', lead.tags[0]);
    }
  };

  // Submeter formulário
  const onSubmit = async (data: ClienteFormData) => {
    if (!token) {
      toast.error('Erro de autenticação', { description: 'Por favor, faça login novamente' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.CLIENTES), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: data.nome,
          empreendimento: data.empreendimento || null,
          origem_lead: data.origemLead || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Erro ao criar cliente' }));
        throw new Error(errorData.detail || 'Erro ao criar cliente');
      }

      toast.success('Cliente criado com sucesso!');
      router.push('/clientes');
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao criar cliente', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Novo Cliente</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre um novo cliente ou converta um lead em cliente
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCancel} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Salvando...' : 'Salvar'}
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
            {loadingLeads ? (
              <div className="w-80 bg-background border-r border-border flex flex-col h-full items-center justify-center">
                <p className="text-muted-foreground">Carregando leads...</p>
              </div>
            ) : (
              <LeadSidebarSimple
                leads={allLeads} // Usar todos os leads do estado local
                onLeadClick={handleLeadClick}
                selectedLeadId={selectedLeadId}
              />
            )}
          </div>
        )}

        {/* Formulário */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Dados do Cliente</CardTitle>
                </div>
                <CardDescription>Informações básicas do cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    {...register('nome')}
                    placeholder="Digite o nome completo"
                  />
                  {errors.nome && (
                    <p className="text-sm text-destructive">{errors.nome.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empreendimento">Empreendimento</Label>
                  <Input
                    id="empreendimento"
                    {...register('empreendimento')}
                    placeholder="Digite o nome do empreendimento"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="origemLead">Origem do Lead</Label>
                  <Select
                    value={watch('origemLead')}
                    onValueChange={(value) => setValue('origemLead', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                      <SelectItem value="Indicação">Indicação</SelectItem>
                      <SelectItem value="Site">Site</SelectItem>
                      <SelectItem value="Redes Sociais">Redes Sociais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NovoClientePage() {
  return (
    <FunilVendasProvider>
      <NovoClienteContent />
    </FunilVendasProvider>
  );
}

