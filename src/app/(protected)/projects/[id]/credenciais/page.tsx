'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Edit, Trash2, ExternalLink, Copy, Search, Filter, Key, Lock, Globe, Mail, MessageCircle, Facebook, Search as SearchIcon } from 'lucide-react';
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from '@/config/api';

interface CredencialAcesso {
  id: string;
  nome_acesso: string;
  plataforma: string;
  link_acesso?: string;
  usuario?: string;
  senha: string;  // Senha sempre visível
  ativo: boolean;
  created_at: string;
  updated_at?: string;
}

interface NovaCredencial {
  nome_acesso: string;
  plataforma: string;
  link_acesso: string;
  usuario: string;
  senha: string;
  observacoes: string;
}

interface PlataformaOption {
  value: string;
  label: string;
  icon?: string;
}

export default function CredenciaisPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { token } = useAuth();
  const router = useRouter();
  
  const [credenciais, setCredenciais] = useState<CredencialAcesso[]>([]);
  const [plataformas, setPlataformas] = useState<PlataformaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCredencial, setEditingCredencial] = useState<CredencialAcesso | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  
  const [novaCredencial, setNovaCredencial] = useState<NovaCredencial>({
    nome_acesso: '',
    plataforma: '',
    link_acesso: '',
    usuario: '',
    senha: '',
    observacoes: ''
  });

  const fetchCredenciais = async () => {
    try {
      const response = await fetch(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.CREDENTIALS)}/projeto/${resolvedParams.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCredenciais(data);
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error);
    }
  };

  const fetchPlataformas = async () => {
    try {
      const response = await fetch(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.CREDENTIALS)}/plataformas/disponiveis`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setPlataformas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar plataformas:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCredenciais(), fetchPlataformas()]);
      setLoading(false);
    };

    if (token && resolvedParams.id) {
      loadData();
    }
  }, [token, resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const credencialData = {
        ...novaCredencial,
        projeto_id: resolvedParams.id
      };

      const url = editingCredencial 
        ? `${buildApiUrl(API_CONFIG.ENDPOINTS.CREDENTIALS)}/${editingCredencial.id}`
        : buildApiUrl(API_CONFIG.ENDPOINTS.CREDENTIALS);
      
      const method = editingCredencial ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(credencialData)
      });

      if (response.ok) {
        setShowDialog(false);
        setEditingCredencial(null);
        setNovaCredencial({
          nome_acesso: '',
          plataforma: '',
          link_acesso: '',
          usuario: '',
          senha: '',
          observacoes: ''
        });
        fetchCredenciais();
      } else {
        const errorData = await response.json();
        console.error('Erro ao salvar credencial:', errorData.detail || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao salvar credencial:', error);
    }
  };

  const handleEdit = (credencial: CredencialAcesso) => {
    setEditingCredencial(credencial);
    setNovaCredencial({
      nome_acesso: credencial.nome_acesso,
      plataforma: credencial.plataforma,
      link_acesso: credencial.link_acesso || '',
      usuario: credencial.usuario || '',
      senha: '', // Não pré-preenchemos a senha por segurança
      observacoes: ''
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta credencial?')) return;

    try {
      const response = await fetch(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.CREDENTIALS)}/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        fetchCredenciais();
      } else {
        console.error('Erro ao excluir credencial');
      }
    } catch (error) {
      console.error('Erro ao excluir credencial:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getPlataformaIcon = (plataforma: string) => {
    const platform = plataformas.find(p => p.value === plataforma.toLowerCase());
    switch (platform?.icon || plataforma.toLowerCase()) {
      case 'mail': return <Mail className="h-4 w-4" />;
      case 'message-circle': return <MessageCircle className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'search': return <SearchIcon className="h-4 w-4" />;
      case 'globe': return <Globe className="h-4 w-4" />;
      default: return <Key className="h-4 w-4" />;
    }
  };

  const filteredCredenciais = credenciais.filter(cred => {
    const matchesSearch = cred.nome_acesso.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cred.plataforma.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cred.usuario && cred.usuario.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPlatform = !filterPlatform || cred.plataforma.toLowerCase() === filterPlatform.toLowerCase();
    
    return matchesSearch && matchesPlatform;
  });

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Credenciais de Acesso</h1>
          <p className="text-muted-foreground">Gerencie senhas e acessos do projeto</p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCredencial(null);
              setNovaCredencial({
                nome_acesso: '',
                plataforma: '',
                link_acesso: '',
                usuario: '',
                senha: '',
                observacoes: ''
              });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Credencial
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCredencial ? 'Editar Credencial' : 'Nova Credencial'}
              </DialogTitle>
              <DialogDescription>
                {editingCredencial ? 'Atualize as informações da credencial' : 'Adicione uma nova credencial de acesso'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome_acesso">Nome do Acesso</Label>
                  <Input
                    id="nome_acesso"
                    value={novaCredencial.nome_acesso}
                    onChange={(e) => setNovaCredencial(prev => ({ ...prev, nome_acesso: e.target.value }))}
                    placeholder="Ex: Gmail Marketing Principal"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="plataforma">Plataforma</Label>
                  <Select
                    value={novaCredencial.plataforma}
                    onValueChange={(value) => setNovaCredencial(prev => ({ ...prev, plataforma: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      {plataformas.map((plataforma) => (
                        <SelectItem key={plataforma.value} value={plataforma.value}>
                          {plataforma.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="link_acesso">Link de Acesso</Label>
                <Input
                  id="link_acesso"
                  type="url"
                  value={novaCredencial.link_acesso}
                  onChange={(e) => setNovaCredencial(prev => ({ ...prev, link_acesso: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usuario">Usuário/Email</Label>
                  <Input
                    id="usuario"
                    value={novaCredencial.usuario}
                    onChange={(e) => setNovaCredencial(prev => ({ ...prev, usuario: e.target.value }))}
                    placeholder="usuario@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="text"
                    value={novaCredencial.senha}
                    onChange={(e) => setNovaCredencial(prev => ({ ...prev, senha: e.target.value }))}
                    placeholder="Senha visível"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={novaCredencial.observacoes}
                  onChange={(e) => setNovaCredencial(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCredencial ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, plataforma ou usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por plataforma" />
              </SelectTrigger>
              <SelectContent>
                {plataformas.map((plataforma) => (
                  <SelectItem key={plataforma.value} value={plataforma.value}>
                    {plataforma.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterPlatform && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterPlatform('')}
                className="px-2"
              >
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Credenciais */}
      <Card>
        <CardHeader>
          <CardTitle>Credenciais Cadastradas ({filteredCredenciais.length})</CardTitle>
          <CardDescription>
            Lista de todas as credenciais de acesso do projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCredenciais.length === 0 ? (
            <div className="text-center py-8">
              <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma credencial encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterPlatform ? 'Tente ajustar os filtros de busca' : 'Comece adicionando uma nova credencial'}
              </p>
              {!searchTerm && !filterPlatform && (
                <Button onClick={() => setShowDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeira Credencial
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Nome do Acesso</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Senha</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCredenciais.map((credencial) => (
                  <TableRow key={credencial.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPlataformaIcon(credencial.plataforma)}
                        <span className="font-medium">{credencial.plataforma}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{credencial.nome_acesso}</p>
                        {credencial.link_acesso && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-xs"
                            onClick={() => window.open(credencial.link_acesso, '_blank')}
                          >
                            <ExternalLink className="mr-1 h-3 w-3" />
                            Acessar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {credencial.usuario ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{credencial.usuario}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(credencial.usuario!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">
                          {credencial.senha}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(credencial.senha)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={credencial.ativo ? "default" : "secondary"}>
                        {credencial.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(credencial)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(credencial.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 