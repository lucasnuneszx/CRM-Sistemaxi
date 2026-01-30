'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Send, Users } from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '@/config/api';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function EnviarNotificacaoPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Form data
  const [tipo, setTipo] = useState<'nudge' | 'info' | 'urgent'>('info');
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [contexto_tipo, setContextoTipo] = useState<string>('');
  const [contexto_id, setContextoId] = useState<string>('');
  const [contexto_nome, setContextoNome] = useState<string>('');
  const [action_url, setActionUrl] = useState<string>('');

  // Verificar permissão
  useEffect(() => {
    if (!user) return;
    
    // Verificar se é admin ou gestor de projeto
    const isAdmin = user.is_admin || user.role === 'admin';
    
    if (!isAdmin) {
      // Verificar se é gestor de projeto (owner de algum projeto)
      const checkProjectManager = async () => {
        if (!token) return;
        
        try {
          const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS_V1), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const projects = await response.json();
            const isProjectManager = projects.some((p: any) => p.owner_id === user.id);
            
            if (!isProjectManager) {
              toast.error('Acesso negado', {
                description: 'Apenas administradores e gestores de projeto podem enviar notificações'
              });
              router.push('/dashboard');
            }
          }
        } catch (error) {
          console.error('Erro ao verificar permissão:', error);
        }
      };
      
      checkProjectManager();
    }
  }, [user, token, router]);

  // Carregar usuários
  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USERS), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data.filter((u: any) => u.is_active && u.id !== user?.id));
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        toast.error('Erro ao carregar usuários');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [token, user]);

  // Selecionar/deselecionar todos
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedUsers(users.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Toggle seleção de usuário
  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      
      setSelectAll(newSelection.length === users.length);
      return newSelection;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error('Erro de autenticação');
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error('Selecione pelo menos um usuário');
      return;
    }

    if (!titulo.trim() || !mensagem.trim()) {
      toast.error('Preencha título e mensagem');
      return;
    }

    setLoading(true);

    try {
      const notificacaoData = {
        tipo,
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        contexto_tipo: contexto_tipo || null,
        contexto_id: contexto_id || null,
        contexto_nome: contexto_nome || null,
        action_url: action_url || null,
      };

      // Enviar para múltiplos usuários
      // Construir query string com múltiplos usuario_ids
      const queryParams = selectedUsers.map(id => `usuario_ids=${id}`).join('&');
      const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.NOTIFICACOES}/multiple?${queryParams}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificacaoData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Erro ao enviar notificação' }));
        throw new Error(errorData.detail || 'Erro ao enviar notificação');
      }

      toast.success(`Notificação enviada para ${selectedUsers.length} usuário(s)!`);
      
      // Limpar formulário
      setTitulo('');
      setMensagem('');
      setContextoTipo('');
      setContextoId('');
      setContextoNome('');
      setActionUrl('');
      setSelectedUsers([]);
      setSelectAll(false);
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error('Erro ao enviar notificação', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Enviar Notificação</CardTitle>
          <CardDescription>
            Envie avisos e cobranças de atividades pendentes para os usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de notificação */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Notificação *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informativo</SelectItem>
                  <SelectItem value="nudge">Cobrança de Status</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Atividade pendente"
                required
              />
            </div>

            {/* Mensagem */}
            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem *</Label>
              <Textarea
                id="mensagem"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite a mensagem da notificação"
                rows={4}
                required
              />
            </div>

            {/* Contexto (opcional) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contexto_tipo">Tipo de Contexto</Label>
                <Select value={contexto_tipo} onValueChange={setContextoTipo}>
                  <SelectTrigger id="contexto_tipo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Projeto</SelectItem>
                    <SelectItem value="activity">Atividade</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="proposal">Proposta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contexto_id">ID do Contexto</Label>
                <Input
                  id="contexto_id"
                  value={contexto_id}
                  onChange={(e) => setContextoId(e.target.value)}
                  placeholder="UUID do contexto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contexto_nome">Nome do Contexto</Label>
                <Input
                  id="contexto_nome"
                  value={contexto_nome}
                  onChange={(e) => setContextoNome(e.target.value)}
                  placeholder="Ex: Nome do projeto"
                />
              </div>
            </div>

            {/* URL de ação */}
            <div className="space-y-2">
              <Label htmlFor="action_url">URL de Ação (opcional)</Label>
              <Input
                id="action_url"
                value={action_url}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="/projects/123"
              />
            </div>

            {/* Seleção de usuários */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Destinatários *</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm font-normal cursor-pointer">
                    Selecionar todos ({users.length})
                  </Label>
                </div>
              </div>
              
              <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                {loadingUsers ? (
                  <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum usuário disponível</p>
                ) : (
                  <div className="space-y-2">
                    {users.map((userItem) => (
                      <div
                        key={userItem.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                        onClick={() => toggleUser(userItem.id)}
                      >
                        <Checkbox
                          checked={selectedUsers.includes(userItem.id)}
                          onCheckedChange={() => toggleUser(userItem.id)}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{userItem.name}</p>
                          <p className="text-xs text-muted-foreground">{userItem.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedUsers.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedUsers.length} usuário(s) selecionado(s)
                </p>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || selectedUsers.length === 0}>
                <Send className="mr-2 h-4 w-4" />
                {loading ? 'Enviando...' : 'Enviar Notificação'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

