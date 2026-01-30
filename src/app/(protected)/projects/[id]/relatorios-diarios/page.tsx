'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Calendar, TrendingUp, DollarSign, Users, FileBarChart, Filter, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from '@/config/api';

interface RelatorioDiario {
  id: string;
  data_referente: string;
  criacao_criativos: boolean;
  identidade_visual: boolean;
  outras_atividades?: string;
  valor_investido?: number;
  leads?: number;
  custo_por_lead?: number;
  registros?: number;
  custo_por_registro?: number;
  deposito?: number;
  ftd?: number;
  custo_por_ftd?: number;
  valor_ftd?: number;
  cpa?: number;
  comissao_cpa?: number;
  revshare?: number;
  total_comissao_dia?: number;
  observacoes?: string;
  created_at: string;
}

interface Estatisticas {
  total_relatorios: number;
  total_valor_investido: number;
  total_leads: number;
  total_registros: number;
  total_deposito: number;
  total_ftd: number;
  total_comissao: number;
  media_custo_por_lead?: number;
  media_custo_por_registro?: number;
  media_custo_por_ftd?: number;
}

export default function RelatoriosDiariosPage() {
  const { id: projectId } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  
  const [relatorios, setRelatorios] = useState<RelatorioDiario[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [projeto, setProjeto] = useState<{ nome: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: ''
  });

  const fetchRelatorios = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filtros.data_inicio) queryParams.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) queryParams.append('data_fim', filtros.data_fim);

      const response = await fetch(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.DAILY_REPORTS)}/projeto/${projectId}?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar relatórios');
      }

      const data = await response.json();
      setRelatorios(data);
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
        `${buildApiUrl(API_CONFIG.ENDPOINTS.DAILY_REPORTS)}/projeto/${projectId}/estatisticas?${queryParams}`,
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRelatorios(), fetchEstatisticas(), fetchProjeto()]);
      setLoading(false);
    };

    if (token && projectId) {
      loadData();
    }
  }, [token, projectId, filtros]);

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    // Adiciona timezone para evitar conversão UTC
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const limparFiltros = () => {
    setFiltros({ data_inicio: '', data_fim: '' });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-6 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-600 text-lg mb-4">❌ {error}</div>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <Button variant="ghost" onClick={() => router.back()} className="self-start hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <FileBarChart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Relatórios Diários</span>
              <span className="sm:hidden bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Relatórios</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Acompanhe o desempenho diário do projeto <span className="text-blue-600 dark:text-blue-400 font-medium">{projeto?.nome || ''}</span>
            </p>
          </div>
        </div>
        <Button 
          onClick={() => router.push(`/projects/${projectId}/relatorios-diarios/new`)}
          className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Novo Relatório</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Investido</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                {formatCurrency(estatisticas.total_valor_investido)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{estatisticas.total_leads}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Comissão</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                {formatCurrency(estatisticas.total_comissao)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Relatórios</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-300">{estatisticas.total_relatorios}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-6 shadow-md bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-700 dark:text-slate-300">
            <Filter className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="space-y-2 w-full sm:w-auto">
              <Label htmlFor="data_inicio" className="text-sm font-medium text-slate-600 dark:text-slate-400">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value }))}
                className="w-full border-indigo-200 dark:border-indigo-700 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2 w-full sm:w-auto">
              <Label htmlFor="data_fim" className="text-sm font-medium text-slate-600 dark:text-slate-400">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value }))}
                className="w-full border-indigo-200 dark:border-indigo-700 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={limparFiltros}
              className="w-full sm:w-auto border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              size="sm"
            >
              <span className="hidden sm:inline">Limpar Filtros</span>
              <span className="sm:hidden">Limpar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Relatórios */}
      <Card className="shadow-lg border-slate-200 dark:border-slate-700">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50">
          <CardTitle className="text-slate-700 dark:text-slate-300">Lista de Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          {relatorios.length === 0 ? (
            <div className="text-center py-12">
              <FileBarChart className="h-12 w-12 text-blue-400 dark:text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
                Nenhum relatório encontrado
              </h3>
              <p className="text-slate-500 dark:text-slate-500 mb-4">
                Comece criando seu primeiro relatório diário.
              </p>
              <Button 
                onClick={() => router.push(`/projects/${projectId}/relatorios-diarios/new`)}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Relatório
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                    <TableHead className="min-w-[100px] text-slate-600 dark:text-slate-400">Data</TableHead>
                    <TableHead className="min-w-[100px] hidden sm:table-cell text-slate-600 dark:text-slate-400">Investido</TableHead>
                    <TableHead className="min-w-[80px] text-slate-600 dark:text-slate-400">Leads</TableHead>
                    <TableHead className="min-w-[80px] hidden md:table-cell text-slate-600 dark:text-slate-400">FTD</TableHead>
                    <TableHead className="min-w-[100px] hidden lg:table-cell text-slate-600 dark:text-slate-400">Comissão</TableHead>
                    <TableHead className="min-w-[120px] text-slate-600 dark:text-slate-400">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatorios.map((relatorio) => (
                    <TableRow key={relatorio.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <TableCell className="font-medium text-sm text-slate-700 dark:text-slate-300">
                        {formatDate(relatorio.data_referente)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {formatCurrency(relatorio.valor_investido)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">{relatorio.leads || 0}</span>
                          {relatorio.custo_por_lead && (
                            <span className="text-xs text-muted-foreground hidden sm:block">
                              {formatCurrency(relatorio.custo_por_lead)}/lead
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        <div className="flex flex-col">
                          <span className="text-purple-600 dark:text-purple-400 font-medium">{relatorio.ftd || 0}</span>
                          {relatorio.valor_ftd && (
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(relatorio.valor_ftd)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            (relatorio.total_comissao_dia || 0) >= 0 
                              ? 'border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30'
                              : 'border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30'
                          }`}
                        >
                          {formatCurrency(relatorio.total_comissao_dia)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col sm:flex-row gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/projects/${projectId}/relatorios-diarios/${relatorio.id}`)}
                            className="w-full sm:w-auto text-xs border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                          >
                            <span className="hidden sm:inline">Ver</span>
                            <span className="sm:hidden">👁️</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/projects/${projectId}/relatorios-diarios/${relatorio.id}/compacta`)}
                            title="Visualização Compacta"
                            className="w-full sm:w-auto text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                          >
                            📋
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/projects/${projectId}/relatorios-diarios/${relatorio.id}/edit`)}
                            className="w-full sm:w-auto text-xs border-yellow-300 dark:border-yellow-700 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
                          >
                            <span className="hidden sm:inline">Editar</span>
                            <span className="sm:hidden">✏️</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 