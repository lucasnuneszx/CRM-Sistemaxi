'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, AlertCircle, MessageSquare, Bell, Loader2, Send, Paperclip, X } from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '@/config/api';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  owner_id: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  team_members?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

interface Atividade {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  projeto_id: string | null;
  projeto?: {
    id: string;
    name: string;
  };
  responsavel_id: string | null;
  responsavel?: {
    id: string;
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function CobrancaPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [sendingNotification, setSendingNotification] = useState<string | null>(null);
  
  // Estado do modal de mensagem direta
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Carregar projetos, atividades e usuários
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar projetos
        const projectsResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS_V1), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData);
          
          // Buscar equipe de cada projeto
          for (const project of projectsData) {
            try {
              const teamResponse = await fetch(
                buildApiUrl(`/v1/user-projects/projects/${project.id}/users`),
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );
              
              if (teamResponse.ok) {
                const teamData = await teamResponse.json();
                project.team_members = teamData.map((up: any) => up.user).filter(Boolean);
              }
            } catch (error) {
              console.error(`Erro ao buscar equipe do projeto ${project.id}:`, error);
            }
          }
        }

        // Buscar atividades pendentes
        const atividadesResponse = await fetch(
          buildApiUrl(`${API_CONFIG.ENDPOINTS.ACTIVITIES_OLD}?include=projeto,responsavel`),
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (atividadesResponse.ok) {
          const atividadesData = await atividadesResponse.json();
          // Filtrar apenas atividades pendentes (não concluídas)
          const pendentes = atividadesData.filter((a: any) => 
            a.status !== 'Concluída' && a.status !== 'concluida' && a.status !== 'completed'
          );
          setAtividades(pendentes);
        }

        // Buscar todos os usuários
        const usersResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USERS), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setAllUsers(usersData.filter((u: any) => u.is_active && u.id !== user?.id));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  // Enviar notificação de cobrança
  const handleCobrar = async (
    type: 'cobrar' | 'sinalizar' | 'mensagem',
    projectId: string,
    projectName: string,
    atividadeId?: string,
    atividadeNome?: string
  ) => {
    if (!token) return;

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    setSendingNotification(`${type}-${projectId}-${atividadeId || 'project'}`);

    try {
      // Coletar destinatários: proprietário + equipe
      const destinatarios: string[] = [];
      
      if (project.owner_id) {
        destinatarios.push(project.owner_id);
      }
      
      if (project.team_members) {
        project.team_members.forEach(member => {
          if (member.id && !destinatarios.includes(member.id)) {
            destinatarios.push(member.id);
          }
        });
      }

      if (destinatarios.length === 0) {
        toast.error('Nenhum destinatário encontrado');
        setSendingNotification(null);
        return;
      }

      // Preparar mensagem baseada no tipo
      let titulo = '';
      let mensagem = '';
      let tipoNotificacao: 'nudge' | 'info' | 'urgent' = 'nudge';

      if (type === 'cobrar') {
        titulo = atividadeId 
          ? `Cobrança: Atividade "${atividadeNome}" pendente`
          : `Cobrança: Projeto "${projectName}"`;
        mensagem = atividadeId
          ? `A atividade "${atividadeNome}" do projeto "${projectName}" está pendente e precisa de atenção.`
          : `O projeto "${projectName}" possui atividades pendentes que precisam de atenção.`;
        tipoNotificacao = 'urgent';
      } else if (type === 'sinalizar') {
        titulo = atividadeId
          ? `Sinalização: Atividade "${atividadeNome}"`
          : `Sinalização: Projeto "${projectName}"`;
        mensagem = atividadeId
          ? `A atividade "${atividadeNome}" do projeto "${projectName}" foi sinalizada para revisão.`
          : `O projeto "${projectName}" foi sinalizado para revisão.`;
        tipoNotificacao = 'nudge';
      } else {
        titulo = atividadeId
          ? `Mensagem: Atividade "${atividadeNome}"`
          : `Mensagem: Projeto "${projectName}"`;
        mensagem = atividadeId
          ? `Você tem uma mensagem sobre a atividade "${atividadeNome}" do projeto "${projectName}".`
          : `Você tem uma mensagem sobre o projeto "${projectName}".`;
        tipoNotificacao = 'info';
      }

      // Enviar notificação para todos os destinatários
      const queryParams = destinatarios.map(id => `usuario_ids=${id}`).join('&');
      
      // Preparar dados da notificação
      const notificacaoData: any = {
        tipo: tipoNotificacao,
        titulo,
        mensagem,
        contexto_tipo: atividadeId ? 'activity' : 'project',
        contexto_nome: atividadeNome || projectName,
      };
      
      // Adicionar contexto_id apenas se não for null
      if (atividadeId || projectId) {
        notificacaoData.contexto_id = atividadeId || projectId;
      }
      
      // Adicionar action_url apenas se houver
      const actionUrl = atividadeId 
        ? `/atividades/${atividadeId}`
        : `/projects/${projectId}`;
      if (actionUrl) {
        notificacaoData.action_url = actionUrl;
      }
      
      const response = await fetch(
        buildApiUrl(`${API_CONFIG.ENDPOINTS.NOTIFICACOES}/multiple?${queryParams}`),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificacaoData),
        }
      );

      if (!response.ok) {
        let errorMessage = 'Erro ao enviar notificação';
        try {
          const errorData = await response.json();
          // Extrair mensagem de erro de diferentes formatos possíveis
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string' 
              ? errorData.detail 
              : JSON.stringify(errorData.detail);
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (errorData?.error) {
            errorMessage = typeof errorData.error === 'string'
              ? errorData.error
              : JSON.stringify(errorData.error);
          } else {
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
        } catch (parseError) {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const actionText = type === 'cobrar' ? 'Cobrança enviada' : type === 'sinalizar' ? 'Sinalização enviada' : 'Mensagem enviada';
      toast.success(`${actionText} para ${destinatarios.length} destinatário(s)!`);
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error('Erro ao enviar notificação', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setSendingNotification(null);
    }
  };

  // Enviar mensagem direta
  const handleSendDirectMessage = async () => {
    if (!token || !selectedUser || !messageTitle.trim() || !messageContent.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSendingMessage(true);

    try {
      // Por enquanto, não vamos fazer upload do arquivo, apenas enviar a notificação
      // O anexo pode ser implementado depois com MinIO ou similar
      let mensagemCompleta = messageContent;
      if (attachedFile) {
        mensagemCompleta += `\n\n[Anexo: ${attachedFile.name}]`;
      }

      // Preparar dados da notificação (sem campos null)
      const notificacaoData: any = {
        tipo: 'info',
        titulo: messageTitle.trim(),
        mensagem: mensagemCompleta,
      };
      
      const response = await fetch(
        buildApiUrl(`${API_CONFIG.ENDPOINTS.NOTIFICACOES}/multiple?usuario_ids=${selectedUser}`),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificacaoData),
        }
      );

      if (!response.ok) {
        let errorMessage = 'Erro ao enviar mensagem';
        try {
          const errorData = await response.json();
          // Extrair mensagem de erro de diferentes formatos possíveis
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string' 
              ? errorData.detail 
              : JSON.stringify(errorData.detail);
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (errorData?.error) {
            errorMessage = typeof errorData.error === 'string'
              ? errorData.error
              : JSON.stringify(errorData.error);
          } else {
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
        } catch (parseError) {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      toast.success('Mensagem enviada com sucesso!');
      
      // Limpar formulário
      setSelectedUser('');
      setMessageTitle('');
      setMessageContent('');
      setAttachedFile(null);
      setIsMessageDialogOpen(false);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Agrupar atividades por projeto
  const atividadesPorProjeto = atividades.reduce((acc, atividade) => {
    const projetoId = atividade.projeto_id || 'sem-projeto';
    if (!acc[projetoId]) {
      acc[projetoId] = [];
    }
    acc[projetoId].push(atividade);
    return acc;
  }, {} as Record<string, Atividade[]>);

  // Atividades sem projeto
  const atividadesSemProjeto = atividades.filter(a => !a.projeto_id);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />
              Enviar Mensagem Direta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Enviar Mensagem Direta</DialogTitle>
              <DialogDescription>
                Envie uma mensagem diretamente para um usuário
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user-select">Usuário *</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger id="user-select">
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message-title">Título *</Label>
                <Input
                  id="message-title"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="Digite o título da mensagem"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message-content">Mensagem *</Label>
                <Textarea
                  id="message-content"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Digite sua mensagem"
                  rows={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file-attachment">Anexo (opcional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-attachment"
                    type="file"
                    onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {attachedFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Paperclip className="h-4 w-4" />
                      <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAttachedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsMessageDialogOpen(false)}
                  disabled={sendingMessage}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendDirectMessage}
                  disabled={sendingMessage || !selectedUser || !messageTitle.trim() || !messageContent.trim()}
                >
                  {sendingMessage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Mensagem
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cobrança</CardTitle>
          <CardDescription>
            Gerencie cobranças, sinalizações e mensagens para projetos e atividades pendentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Grid de Projetos e Atividades */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna 1: Projetos */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Projetos</h2>
              {projects.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">Nenhum projeto encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => {
                    const atividadesDoProjeto = atividadesPorProjeto[project.id] || [];
                    const hasPendentes = atividadesDoProjeto.length > 0;
                    
                    return (
                      <Card key={project.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
                              {project.description && (
                                <CardDescription className="line-clamp-2">
                                  {project.description}
                                </CardDescription>
                              )}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {project.status}
                                </Badge>
                                {hasPendentes && (
                                  <Badge variant="destructive" className="text-xs">
                                    {atividadesDoProjeto.length} pendente(s)
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                <p>Proprietário: {project.owner?.name || 'N/A'}</p>
                                {project.team_members && project.team_members.length > 0 && (
                                  <p>Equipe: {project.team_members.length} membro(s)</p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCobrar('cobrar', project.id, project.name)}
                                disabled={sendingNotification === `cobrar-${project.id}-project`}
                                className="w-full"
                              >
                                {sendingNotification === `cobrar-${project.id}-project` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Bell className="h-3 w-3 mr-1" />
                                    Cobrar
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCobrar('sinalizar', project.id, project.name)}
                                disabled={sendingNotification === `sinalizar-${project.id}-project`}
                                className="w-full"
                              >
                                {sendingNotification === `sinalizar-${project.id}-project` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Sinalizar
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCobrar('mensagem', project.id, project.name)}
                                disabled={sendingNotification === `mensagem-${project.id}-project`}
                                className="w-full"
                              >
                                {sendingNotification === `mensagem-${project.id}-project` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Mensagem
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        {hasPendentes && (
                          <CardContent className="pt-0">
                            <Separator className="mb-3" />
                            <h3 className="text-sm font-semibold mb-3">Atividades Pendentes</h3>
                            <div className="space-y-2">
                              {atividadesDoProjeto.map((atividade) => (
                                <div
                                  key={atividade.id}
                                  className="flex items-start justify-between gap-3 p-2 bg-muted/50 rounded-md"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{atividade.nome}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <Badge variant="outline" className="text-xs">
                                        {atividade.status}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {atividade.prioridade}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleCobrar('cobrar', project.id, project.name, atividade.id, atividade.nome)}
                                      disabled={sendingNotification === `cobrar-${project.id}-${atividade.id}`}
                                      title="Cobrar"
                                    >
                                      {sendingNotification === `cobrar-${project.id}-${atividade.id}` ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Bell className="h-3 w-3" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleCobrar('sinalizar', project.id, project.name, atividade.id, atividade.nome)}
                                      disabled={sendingNotification === `sinalizar-${project.id}-${atividade.id}`}
                                      title="Sinalizar"
                                    >
                                      {sendingNotification === `sinalizar-${project.id}-${atividade.id}` ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <AlertCircle className="h-3 w-3" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleCobrar('mensagem', project.id, project.name, atividade.id, atividade.nome)}
                                      disabled={sendingNotification === `mensagem-${project.id}-${atividade.id}`}
                                      title="Mensagem"
                                    >
                                      {sendingNotification === `mensagem-${project.id}-${atividade.id}` ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <MessageSquare className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Coluna 2: Atividades */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Atividades Pendentes</h2>
              {atividades.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">Nenhuma atividade pendente</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {atividades.map((atividade) => (
                    <Card key={atividade.id} className="border-l-4 border-l-purple-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base mb-1">{atividade.nome}</CardTitle>
                            {atividade.descricao && (
                              <CardDescription className="line-clamp-2 text-xs">
                                {atividade.descricao}
                              </CardDescription>
                            )}
                            {atividade.projeto && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Projeto: {atividade.projeto.name}
                              </p>
                            )}
                            {atividade.responsavel && (
                              <p className="text-xs text-muted-foreground">
                                Responsável: {atividade.responsavel.name}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {atividade.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {atividade.prioridade}
                              </Badge>
                            </div>
                          </div>
                          {atividade.projeto_id && (
                            <div className="flex flex-col gap-1 shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => handleCobrar('cobrar', atividade.projeto_id!, atividade.projeto?.name || '', atividade.id, atividade.nome)}
                                disabled={sendingNotification === `cobrar-${atividade.projeto_id}-${atividade.id}`}
                                title="Cobrar"
                              >
                                {sendingNotification === `cobrar-${atividade.projeto_id}-${atividade.id}` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Bell className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => handleCobrar('sinalizar', atividade.projeto_id!, atividade.projeto?.name || '', atividade.id, atividade.nome)}
                                disabled={sendingNotification === `sinalizar-${atividade.projeto_id}-${atividade.id}`}
                                title="Sinalizar"
                              >
                                {sendingNotification === `sinalizar-${atividade.projeto_id}-${atividade.id}` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <AlertCircle className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => handleCobrar('mensagem', atividade.projeto_id!, atividade.projeto?.name || '', atividade.id, atividade.nome)}
                                disabled={sendingNotification === `mensagem-${atividade.projeto_id}-${atividade.id}`}
                                title="Mensagem"
                              >
                                {sendingNotification === `mensagem-${atividade.projeto_id}-${atividade.id}` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <MessageSquare className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
