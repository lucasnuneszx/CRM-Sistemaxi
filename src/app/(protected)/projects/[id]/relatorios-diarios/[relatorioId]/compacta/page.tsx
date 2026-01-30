'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  DollarSign, 
  Users, 
  Target, 
  Zap, 
  Award,
  CheckCircle2,
  FileText,
  Activity,
  Minimize2,
  Edit
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from '@/config/api';


interface RelatorioDiario {
  id: string;
  data_referente: string;
  outras_atividades?: string;
  atividades_realizadas_ids?: string[];
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

interface Atividade {
  id: string;
  nome: string;
  status: string;
  descricao?: string;
}

export default function RelatorioCompactaPage() {
  const { id: projectId, relatorioId } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  
  const [relatorio, setRelatorio] = useState<RelatorioDiario | null>(null);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [projeto, setProjeto] = useState<{ nome: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar relatório
        const relatorioResponse = await fetch(
          `${buildApiUrl(API_CONFIG.ENDPOINTS.DAILY_REPORTS)}/${relatorioId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!relatorioResponse.ok) {
          throw new Error('Erro ao carregar relatório');
        }

        const relatorioData = await relatorioResponse.json();
        setRelatorio(relatorioData);

        // Buscar projeto
        const projetoResponse = await fetch(
          `${buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS_V1)}/${projectId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (projetoResponse.ok) {
          const projetoData = await projetoResponse.json();
          setProjeto(projetoData);
        }

        // Buscar atividades se tiver IDs
        if (relatorioData.atividades_realizadas_ids && relatorioData.atividades_realizadas_ids.length > 0) {
          const atividadesResponse = await fetch(
            `${buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITIES)}/projeto/${projectId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (atividadesResponse.ok) {
            const atividadesData = await atividadesResponse.json();
            const atividadesRealizadas = atividadesData.filter((ativ: Atividade) => 
              relatorioData.atividades_realizadas_ids?.includes(ativ.id)
            );
            setAtividades(atividadesRealizadas);
          }
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    if (token && projectId && relatorioId) {
      fetchData();
    }
  }, [token, projectId, relatorioId]);

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

  const formatNumber = (value: number | undefined) => {
    if (!value) return '0';
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const calculateConversionRate = (converted: number | undefined, total: number | undefined) => {
    if (!converted || !total || total === 0) return 0;
    return (converted / total) * 100;
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-4">
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-1/2 mb-1" />
                  <Skeleton className="h-6 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !relatorio) {
    return (
      <div className="container mx-auto py-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-red-600 mb-2">❌ {error || 'Relatório não encontrado'}</div>
            <Button onClick={() => router.back()}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const leadToRegistroRate = calculateConversionRate(relatorio.registros, relatorio.leads);
  const leadToFtdRate = calculateConversionRate(relatorio.ftd, relatorio.leads);

  return (
    <div className="container mx-auto py-2 space-y-3 max-h-screen overflow-y-auto">
      {/* Header Ultra Compacto e Responsivo */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-2 sm:p-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex-shrink-0">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Voltar</span>
              </Button>
              <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-none">
                <Minimize2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="font-semibold text-sm sm:text-lg truncate">
                  <span className="hidden sm:inline">📊 {projeto?.nome}</span>
                  <span className="sm:hidden">📊 {projeto?.nome?.substring(0, 15)}...</span>
                </span>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  <span className="hidden sm:inline">{formatDate(relatorio.data_referente)}</span>
                  <span className="sm:hidden">{new Date(relatorio.data_referente + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Badge variant="secondary" className="text-xs flex-1 sm:flex-none justify-center">
                <span className="hidden sm:inline">Visualização Compacta</span>
                <span className="sm:hidden">Compacta</span>
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/projects/${projectId}/relatorios-diarios/${relatorioId}`)}
                className="flex-1 sm:flex-none"
              >
                <span className="mr-1">📊</span>
                <span className="hidden sm:inline">Completa</span>
                <span className="sm:hidden">Full</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/projects/${projectId}/relatorios-diarios/${relatorioId}/edit`)}
                className="flex-1 sm:flex-none"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1">Editar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout Principal - Grid Balanceado e Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        
        {/* Card 1: Financeiro */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-3">
              <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{formatCurrency(relatorio.valor_investido)}</div>
                <div className="text-xs text-muted-foreground">Investido</div>
              </div>
              <div className="text-center p-3 bg-green-500/10 rounded-lg">
                <div className="text-lg font-bold text-green-600">{formatCurrency(relatorio.total_comissao_dia)}</div>
                <div className="text-xs text-muted-foreground">Comissão Total</div>
              </div>
              <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                <div className="text-sm font-semibold text-purple-600">
                  ROI: {relatorio.valor_investido && relatorio.total_comissao_dia 
                    ? `${((relatorio.total_comissao_dia / relatorio.valor_investido) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Funil de Conversão */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Leads</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">{formatNumber(relatorio.leads)}</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(relatorio.custo_por_lead)}/lead</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-l-2 border-orange-300 pl-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Registros</span>
                  <Badge variant="outline" className={`text-xs ${getPerformanceColor(leadToRegistroRate, { good: 15, warning: 10 })}`}>
                    {leadToRegistroRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-orange-600">{formatNumber(relatorio.registros)}</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(relatorio.custo_por_registro)}/reg</div>
                </div>
              </div>

              <div className="flex items-center justify-between border-l-2 border-green-300 pl-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="text-sm">FTD</span>
                  <Badge variant="outline" className={`text-xs ${getPerformanceColor(leadToFtdRate, { good: 3, warning: 2 })}`}>
                    {leadToFtdRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{formatNumber(relatorio.ftd)}</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(relatorio.custo_por_ftd)}/ftd</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Performance & Comissões */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4" />
              Performance & Comissões
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-yellow-500/10 rounded-lg text-center">
                  <div className="text-sm font-semibold text-yellow-600">CPA</div>
                  <div className="text-lg font-bold text-yellow-600">{formatNumber(relatorio.cpa)}</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(relatorio.comissao_cpa)}</div>
                </div>
                <div className="p-3 bg-indigo-500/10 rounded-lg text-center">
                  <div className="text-sm font-semibold text-indigo-600">RevShare</div>
                  <div className="text-lg font-bold text-indigo-600">{formatCurrency(relatorio.revshare)}</div>
                  <div className="text-xs text-muted-foreground">
                    {relatorio.valor_ftd && relatorio.revshare 
                      ? `${((relatorio.revshare / relatorio.valor_ftd) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-semibold">Depósito</div>
                  <div className="text-sm font-bold">{formatCurrency(relatorio.deposito)}</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-semibold">Valor FTD</div>
                  <div className="text-sm font-bold">{formatCurrency(relatorio.valor_ftd)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha - Atividades (se houver) */}
      {atividades.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Atividades Realizadas ({atividades.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {atividades.map((atividade) => (
                <div key={atividade.id} className="flex items-center gap-2 text-xs p-2 bg-green-500/10 rounded">
                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <span className="truncate flex-1">{atividade.nome}</span>
                  <Badge variant="outline" className="text-xs py-0 px-1">
                    {atividade.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rodapé com Observações (se houver) */}
      {(relatorio.outras_atividades || relatorio.observacoes) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {relatorio.outras_atividades && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Outras Atividades:</div>
                  <div className="text-sm bg-muted/20 p-3 rounded-lg">
                    {relatorio.outras_atividades.substring(0, 100)}
                    {relatorio.outras_atividades.length > 100 && '...'}
                  </div>
                </div>
              )}
              {relatorio.observacoes && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Observações Gerais:</div>
                  <div className="text-sm bg-muted/20 p-3 rounded-lg">
                    {relatorio.observacoes.substring(0, 100)}
                    {relatorio.observacoes.length > 100 && '...'}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Final Ultra Compacto */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span><strong>{formatNumber(relatorio.leads)}</strong> leads</span>
              <span><strong>{leadToRegistroRate.toFixed(1)}%</strong> conversão</span>
              <span><strong>{formatNumber(relatorio.ftd)}</strong> FTDs</span>
            </div>
            <div className="text-muted-foreground">
              ROI: <strong className="text-purple-600">
                {relatorio.valor_investido && relatorio.total_comissao_dia 
                  ? `${((relatorio.total_comissao_dia / relatorio.valor_investido) * 100).toFixed(1)}%`
                  : '0%'
                }
              </strong>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 