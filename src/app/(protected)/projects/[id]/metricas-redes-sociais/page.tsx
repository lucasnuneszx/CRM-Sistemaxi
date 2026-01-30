'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, MessageCircle, Filter, ArrowLeft, Facebook, Eye, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from '@/config/api';

interface MetricasRedesSociais {
  id: string;
  projeto_id: string;
  data_referente: string;
  seguidores_instagram?: number;
  inscritos_telegram?: number;
  leads_whatsapp?: number;
  seguidores_facebook?: number;
  inscritos_youtube?: number;
  seguidores_tiktok?: number;
  observacoes?: string;
  created_at: string;
  updated_at?: string;
}

interface EstatisticasRedesSociais {
  total_registros: number;
  total_seguidores_instagram?: number;
  total_inscritos_telegram?: number;
  total_leads_whatsapp?: number;
  total_seguidores_facebook?: number;
  total_inscritos_youtube?: number;
  total_seguidores_tiktok?: number;
}

export default function MetricasRedesSociaisPage() {
  const { id: projectId } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  
  const [metricas, setMetricas] = useState<MetricasRedesSociais[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasRedesSociais | null>(null);
  const [projeto, setProjeto] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: ''
  });

  const fetchMetricas = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filtros.data_inicio) queryParams.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) queryParams.append('data_fim', filtros.data_fim);

      const response = await fetch(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.SOCIAL_METRICS)}/projeto/${projectId}?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar métricas');
      }

      const data = await response.json();
      setMetricas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  const fetchEstatisticas = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filtros.data_inicio) queryParams.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) queryParams.append('data_fim', filtros.data_fim);

      const response = await fetch(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.SOCIAL_METRICS)}/projeto/${projectId}/estatisticas?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas');
      }

      const data = await response.json();
      setEstatisticas(data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const fetchProjeto = async () => {
    try {
      const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS_V1)}/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar projeto');
      }

      const data = await response.json();
      setProjeto(data);
    } catch (err) {
      console.error('Erro ao carregar projeto:', err);
    }
  };

  const handleDelete = async (metricaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta métrica?')) {
      return;
    }

    try {
      const response = await fetch(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.SOCIAL_METRICS)}/${metricaId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao excluir métrica');
      }

      await fetchMetricas();
      await fetchEstatisticas();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir métrica');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMetricas(), fetchEstatisticas(), fetchProjeto()]);
      setLoading(false);
    };

    if (token && projectId) {
      loadData();
    }
  }, [token, projectId, filtros, fetchMetricas, fetchEstatisticas, fetchProjeto]);

  const formatNumber = (value: number | undefined) => {
    if (!value) return '-';
    return value.toLocaleString('pt-BR');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push(`/projects/${projectId}`)} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Métricas de Redes Sociais</h1>
            {projeto && (
              <p className="text-muted-foreground">Projeto: {projeto.name}</p>
            )}
          </div>
        </div>
        
        <Button onClick={() => router.push(`/projects/${projectId}/metricas-redes-sociais/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Métrica
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFiltros({ data_inicio: '', data_fim: '' })}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      {estatisticas && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {/* Instagram */}
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Instagram</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatNumber(estatisticas.total_seguidores_instagram)}
                  </p>
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Telegram */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telegram</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(estatisticas.total_inscritos_telegram)}
                  </p>
                  <p className="text-xs text-muted-foreground">Inscritos</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatNumber(estatisticas.total_leads_whatsapp)}
                  </p>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facebook */}
          <Card className="border-l-4 border-l-indigo-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Facebook</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {formatNumber(estatisticas.total_seguidores_facebook)}
                  </p>
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Facebook className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* YouTube */}
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">YouTube</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatNumber(estatisticas.total_inscritos_youtube)}
                  </p>
                  <p className="text-xs text-muted-foreground">Inscritos</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TikTok */}
          <Card className="border-l-4 border-l-gray-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">TikTok</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {formatNumber(estatisticas.total_seguidores_tiktok)}
                  </p>
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-gray-700 to-slate-700 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Métricas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Métricas ({metricas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center text-red-500 py-4">
              <p>Erro: {error}</p>
            </div>
          )}
          
          {metricas.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              <MessageCircle className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg font-semibold">Nenhuma métrica encontrada.</p>
              <p className="text-sm">Clique em &quot;Nova Métrica&quot; para começar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead>Telegram</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Facebook</TableHead>
                  <TableHead>YouTube</TableHead>
                  <TableHead>TikTok</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricas.map((metrica) => (
                  <TableRow key={metrica.id}>
                    <TableCell className="font-medium">
                      {formatDate(metrica.data_referente)}
                    </TableCell>
                    <TableCell>{formatNumber(metrica.seguidores_instagram)}</TableCell>
                    <TableCell>{formatNumber(metrica.inscritos_telegram)}</TableCell>
                    <TableCell>{formatNumber(metrica.leads_whatsapp)}</TableCell>
                    <TableCell>{formatNumber(metrica.seguidores_facebook)}</TableCell>
                    <TableCell>{formatNumber(metrica.inscritos_youtube)}</TableCell>
                    <TableCell>{formatNumber(metrica.seguidores_tiktok)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/projects/${projectId}/metricas-redes-sociais/${metrica.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/projects/${projectId}/metricas-redes-sociais/${metrica.id}/edit`)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(metrica.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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