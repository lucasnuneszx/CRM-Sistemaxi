'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  Zap, 
  Award,
  CheckCircle2,
  FileText,
  BarChart3,
  Eye,
  Percent,
  Activity,
  Edit,
  Clock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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

export default function RelatorioViewPage() {
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
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-8 w-3/4" />
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
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-600 text-lg mb-4">❌ {error || 'Relatório não encontrado'}</div>
            <Button onClick={() => router.back()}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const leadToRegistroRate = calculateConversionRate(relatorio.registros, relatorio.leads);
  const registroToFtdRate = calculateConversionRate(relatorio.ftd, relatorio.registros);
  const leadToFtdRate = calculateConversionRate(relatorio.ftd, relatorio.leads);

  return (
    <div className="container mx-auto py-4 space-y-4">
      {/* Header com estilo premium e responsivo */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl sm:rounded-3xl"></div>
        <Card className="relative border-0 shadow-xl">
          <CardContent className="p-4 sm:p-6">
            {/* Navegação e ações - Layout responsivo */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <Button 
                variant="ghost" 
                onClick={() => router.back()} 
                className="hover:bg-white/50 self-start"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Voltar aos Relatórios</span>
                <span className="sm:hidden">Voltar</span>
              </Button>
              
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Badge variant="outline" className="text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-2 flex-1 sm:flex-none justify-center">
                  <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Visualização Executiva</span>
                  <span className="sm:hidden">Executiva</span>
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/projects/${projectId}/relatorios-diarios/${relatorioId}/compacta`)}
                  className="flex-1 sm:flex-none"
                >
                  <span className="mr-1">📋</span>
                  <span className="hidden sm:inline">Compacta</span>
                  <span className="sm:hidden">Comp</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/projects/${projectId}/relatorios-diarios/${relatorioId}/edit`)}
                  className="flex-1 sm:flex-none"
                >
                  <Edit className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Editar</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              </div>
            </div>
            
            {/* Título e informações principais - Layout responsivo */}
            <div className="text-center space-y-3 sm:space-y-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <span className="hidden sm:inline">📊 Relatório Diário de Performance</span>
                <span className="sm:hidden">📊 Relatório Diário</span>
              </h1>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-base sm:text-lg font-medium">{formatDate(relatorio.data_referente)}</span>
                </div>
                
                <Separator orientation="vertical" className="h-4 sm:h-6 hidden sm:block" />
                <div className="w-full sm:w-px h-px sm:h-auto bg-border sm:hidden"></div>
                
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-lg font-medium text-center">{projeto?.nome}</span>
                </div>
              </div>

              {/* Indicadores de status móvel */}
              <div className="flex justify-center gap-2 sm:hidden">
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  <Clock className="mr-1 h-3 w-3" />
                  {relatorio.created_at ? new Date(relatorio.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                </Badge>
                {relatorio.total_comissao_dia && relatorio.total_comissao_dia > 0 && (
                  <Badge variant="outline" className="text-xs px-2 py-1 border-green-500 text-green-600">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Ativo
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Principais - Layout Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total de Comissão - Destaque Principal */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 opacity-90" />
            <h3 className="text-sm font-medium opacity-90 mb-1">Total de Comissão</h3>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(relatorio.total_comissao_dia)}
            </div>
            <div className="flex justify-center gap-4 text-sm opacity-80">
              <span>CPA: {formatCurrency(relatorio.comissao_cpa)}</span>
              <span>•</span>
              <span>Rev: {formatCurrency(relatorio.revshare)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Valor Investido */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-90" />
            <h3 className="text-sm font-medium opacity-90 mb-1">Investimento</h3>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(relatorio.valor_investido)}
            </div>
            <div className="text-sm opacity-80">
              Capital aplicado no dia
            </div>
          </CardContent>
        </Card>

        {/* ROI Indicador */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-90" />
            <h3 className="text-sm font-medium opacity-90 mb-1">ROI do Dia</h3>
            <div className="text-2xl font-bold mb-1">
              {relatorio.valor_investido && relatorio.total_comissao_dia 
                ? `${((relatorio.total_comissao_dia / relatorio.valor_investido) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
            <div className="text-sm opacity-80">
              Retorno sobre investimento
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funil de Conversão */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <Target className="h-7 w-7 text-blue-600" />
            Funil de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Leads */}
            <div className="text-center space-y-2">
              <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600">{formatNumber(relatorio.leads)}</div>
                <div className="text-sm text-muted-foreground">Leads Gerados</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(relatorio.custo_por_lead)}/lead
                </div>
              </div>
            </div>

            {/* Seta de conversão */}
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl">➡️</div>
                <div className={`text-lg font-bold ${getPerformanceColor(leadToRegistroRate, { good: 15, warning: 10 })}`}>
                  {leadToRegistroRate.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Lead → Registro</div>
              </div>
            </div>

            {/* Registros */}
            <div className="text-center space-y-2">
              <div className="bg-orange-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-orange-600">{formatNumber(relatorio.registros)}</div>
                <div className="text-sm text-muted-foreground">Registros</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(relatorio.custo_por_registro)}/registro
                </div>
              </div>
            </div>

            {/* Seta de conversão */}
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl">➡️</div>
                <div className={`text-lg font-bold ${getPerformanceColor(registroToFtdRate, { good: 25, warning: 15 })}`}>
                  {registroToFtdRate.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Registro → FTD</div>
              </div>
            </div>
          </div>

          {/* Linha final com FTD */}
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">{formatNumber(relatorio.ftd)}</div>
                <div className="text-sm text-muted-foreground">FTD (First Time Deposit)</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(relatorio.custo_por_ftd)}/FTD
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-purple-600">{formatCurrency(relatorio.deposito)}</div>
                <div className="text-sm text-muted-foreground">Volume de Depósito</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Valor total depositado
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="bg-indigo-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
                <Percent className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <div className={`text-xl font-bold ${getPerformanceColor(leadToFtdRate, { good: 3, warning: 2 })}`}>
                  {leadToFtdRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Taxa Lead → FTD</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Conversão total do funil
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Performance e CPA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Award className="h-6 w-6 text-yellow-600" />
              Performance CPA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">CPA Gerados</span>
              <span className="text-2xl font-bold">{formatNumber(relatorio.cpa)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Comissão CPA</span>
              <span className="text-2xl font-bold text-green-600">{formatCurrency(relatorio.comissao_cpa)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor Médio CPA</span>
              <span className="text-lg font-semibold">
                {relatorio.cpa && relatorio.comissao_cpa 
                  ? formatCurrency(relatorio.comissao_cpa / relatorio.cpa)
                  : 'R$ 0,00'
                }
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Revenue Share
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor FTD</span>
              <span className="text-2xl font-bold">{formatCurrency(relatorio.valor_ftd)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Revshare</span>
              <span className="text-2xl font-bold text-blue-600">{formatCurrency(relatorio.revshare)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">% Revshare</span>
              <span className="text-lg font-semibold">
                {relatorio.valor_ftd && relatorio.revshare 
                  ? `${((relatorio.revshare / relatorio.valor_ftd) * 100).toFixed(1)}%`
                  : '0%'
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atividades Realizadas */}
      {atividades.length > 0 && (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-green-600" />
              Atividades Realizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {atividades.map((atividade) => (
                <div key={atividade.id} className="flex items-center space-x-3 p-4 border rounded-lg bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <div className="font-medium">{atividade.nome}</div>
                    <Badge variant="outline" className="mt-1">
                      {atividade.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outras Atividades e Observações */}
              {(relatorio.outras_atividades || relatorio.observacoes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relatorio.outras_atividades && (
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Outras Atividades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {relatorio.outras_atividades}
                </p>
              </CardContent>
            </Card>
          )}

          {relatorio.observacoes && (
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-purple-600" />
                  Observações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {relatorio.observacoes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Resumo Executivo Footer */}
      <Card className="shadow-xl">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-bold mb-3">
            📈 Resumo Executivo do Dia
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                <div className="text-xl font-bold text-blue-600">{formatNumber(relatorio.leads)}</div>
              <div className="text-muted-foreground">Leads Capturados</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-600">{leadToRegistroRate.toFixed(1)}%</div>
              <div className="text-muted-foreground">Taxa de Conversão</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">{formatNumber(relatorio.ftd)}</div>
              <div className="text-muted-foreground">Novos Depositantes</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-600">
                {relatorio.valor_investido && relatorio.total_comissao_dia 
                  ? `${((relatorio.total_comissao_dia / relatorio.valor_investido) * 100).toFixed(1)}%`
                  : '0%'
                }
              </div>
              <div className="text-muted-foreground">ROI Alcançado</div>
            </div>
          </div>
          <div className="mt-6 text-xs text-muted-foreground">
            Relatório gerado em {new Date(relatorio.created_at).toLocaleDateString('pt-BR')} às {new Date(relatorio.created_at).toLocaleTimeString('pt-BR')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 