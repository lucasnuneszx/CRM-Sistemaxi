'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { InfoCard } from "@/components/dashboard/InfoCard";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  TrendingUpIcon,
  RefreshCcw,
  ActivityIcon,
  AlertTriangleIcon,
  LineChartIcon,
  PieChartIcon,
  CalendarIcon,
  UsersIcon,
  WalletIcon,
  CoinsIcon,
  CheckCircle2,
  ClockIcon,
  MessageCircle,
  Instagram,
  Youtube,
  Facebook,
  FileBarChart,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
  Target,
  DollarSign,
  UserPlus,
  Wallet,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart,
  Line
} from 'recharts';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectReportsUrl, getProjectSocialMetricsUrl } from '@/config/api';

// CSS para esconder scrollbars
const hideScrollbarStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

interface DashboardFinanceiro {
  resumo_financeiro: {
    faturamento_atual: number;
    lucro_atual: number;
    despesas_atuais: number;
    roi_atual: number;
    crescimento_faturamento: number;
    crescimento_lucro: number;
    meta_mensal: number;
  };
  dados_mensais: Array<{
    month: string;
    faturamento: number;
    despesas: number;
    lucro: number;
    roi: number;
    registros: number;
    depositos: number;
  }>;
  dados_diarios: Array<{
    data: string;
    registros: number;
    depositos: number;
    leads: number;
    ftd: number;
  }>;
  categorias_despesas: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  metricas_totais: {
    total_faturamento: number;
    total_despesas: number;
    total_lucro: number;
    roi_medio: number;
    total_leads: number;
    total_registros: number;
    total_ftd: number;
    total_relatorios: number;
    total_depositos: number;
    total_valor_depositos: number;
    revshare: number;
  };
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

interface Projeto {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface AtividadesSummary {
  total: number;
  concluidas: number;
  em_andamento: number;
  pendentes: number;
  urgentes: number;
  por_status: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardFinanceiro | null>(null);
  const [projetoDashboards, setProjetoDashboards] = useState<{[key: string]: DashboardFinanceiro}>({});
  const [projetoRedesSociais, setProjetoRedesSociais] = useState<{[key: string]: {estatisticas: EstatisticasRedesSociais, metricas: MetricasRedesSociais[]}}>({});
  const [atividadesSummary, setAtividadesSummary] = useState<AtividadesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('geral');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projetosResponse, dashboardResponse, atividadesResponse] = await Promise.all([
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS), {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DAILY_DASHBOARD), {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITIES_OLD + "?include=responsavel,setor,projeto"), {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      let projetosData: Projeto[] = [];

      if (projetosResponse.ok) {
        const projetosResponse_data = await projetosResponse.json();
        console.log('🔍 Projetos carregados:', projetosResponse_data);
        projetosData = Array.isArray(projetosResponse_data) ? projetosResponse_data : [];
        setProjetos(projetosData);
      }

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        
        // Para o dashboard geral, buscar dados de todos os projetos
        let dadosDiariosGerais: Array<{
          data: string;
          registros: number;
          depositos: number;
          leads: number;
          ftd: number;
        }> = [];
        
        // Agregar métricas totais de todos os projetos
        let metricasTotaisConsolidadas = {
          total_faturamento: 0,
          total_despesas: 0,
          total_lucro: 0,
          roi_medio: 0,
          total_leads: 0,
          total_registros: 0,
          total_ftd: 0,
          total_relatorios: 0,
          total_depositos: 0,
          total_valor_depositos: 0,
          revshare: 0
        };
        
        if (projetosData.length > 0) {
          try {
            console.log('🔄 Buscando dados consolidados para', projetosData.length, 'projetos');
            
            // Buscar dados consolidados de cada projeto
            const consolidadoPromises = projetosData.map(async (projeto: Projeto) => {
              try {
                console.log(`📈 Buscando dados consolidados para projeto ${projeto.name} (${projeto.id})`);
                const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.DAILY_REPORTS)}/dashboard/consolidado?projeto_id=${projeto.id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                  const data = await response.json();
                  console.log(`✅ Dados consolidados encontrados para ${projeto.name}:`, data);
                  return data;
                } else {
                  console.log(`❌ Erro na resposta consolidada para ${projeto.name}:`, response.status);
                }
              } catch (error) {
                console.error(`💥 Erro ao buscar dados consolidados do projeto ${projeto.name}:`, error);
              }
              return null;
            });
            
            const consolidadoResults = await Promise.all(consolidadoPromises);
            
            // Somar todas as métricas dos projetos
            consolidadoResults.forEach((projetoData) => {
              if (projetoData && projetoData.metricas_totais) {
                const metricas = projetoData.metricas_totais;
                metricasTotaisConsolidadas.total_registros += metricas.total_registros || 0;
                metricasTotaisConsolidadas.total_depositos += metricas.total_depositos || 0;
                metricasTotaisConsolidadas.total_valor_depositos += metricas.total_valor_depositos || 0;
                metricasTotaisConsolidadas.revshare += metricas.revshare || 0;
                metricasTotaisConsolidadas.total_leads += metricas.total_leads || 0;
                metricasTotaisConsolidadas.total_ftd += metricas.total_ftd || 0;
                metricasTotaisConsolidadas.total_relatorios += metricas.total_relatorios || 0;
                metricasTotaisConsolidadas.total_faturamento += metricas.total_faturamento || 0;
                metricasTotaisConsolidadas.total_despesas += metricas.total_despesas || 0;
                metricasTotaisConsolidadas.total_lucro += metricas.total_lucro || 0;
              }
            });
            
            // Calcular ROI médio
            if (metricasTotaisConsolidadas.total_despesas > 0) {
              metricasTotaisConsolidadas.roi_medio = (metricasTotaisConsolidadas.total_lucro / metricasTotaisConsolidadas.total_despesas) * 100;
            }
            
            console.log('📊 Métricas totais consolidadas:', metricasTotaisConsolidadas);
            
            // Buscar dados diários para o gráfico
            const allRelatoriosPromises = projetosData.map(async (projeto: Projeto) => {
              try {
                console.log(`📈 Buscando relatórios para projeto ${projeto.name} (${projeto.id})`);
                const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.DAILY_REPORTS)}/projeto/${projeto.id}/ultimos?limit=30`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                  const data = await response.json();
                  console.log(`✅ Dados encontrados para ${projeto.name}:`, data.length, 'relatórios');
                  return data;
                } else {
                  console.log(`❌ Erro na resposta para ${projeto.name}:`, response.status);
                }
              } catch (error) {
                console.error(`💥 Erro ao buscar relatórios do projeto ${projeto.name}:`, error);
              }
              return [];
            });
            
            const allRelatoriosResults = await Promise.all(allRelatoriosPromises);
            const allRelatorios = allRelatoriosResults.flat();
            console.log('📊 Total de relatórios encontrados:', allRelatorios.length);
            
            // Agrupar dados por data
            const groupedByDate: {[key: string]: {registros: number, depositos: number, leads: number, ftd: number}} = {};
            
            allRelatorios.forEach((relatorio: {
              data_referente: string;
              registros?: number;
              ftd?: number;
              leads?: number;
            }) => {
              const dateKey = new Date(relatorio.data_referente).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit' 
              });
              
              if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = { registros: 0, depositos: 0, leads: 0, ftd: 0 };
              }
              
              groupedByDate[dateKey].registros += relatorio.registros || 0;
              groupedByDate[dateKey].depositos += relatorio.ftd || 0;
              groupedByDate[dateKey].leads += relatorio.leads || 0;
              groupedByDate[dateKey].ftd += relatorio.ftd || 0;
            });
            
            // Converter para array
            dadosDiariosGerais = Object.entries(groupedByDate)
              .map(([data, valores]) => ({
                data,
                ...valores
              }))
              .sort((a, b) => {
                const dateA = new Date(a.data.split('/').reverse().join('-'));
                const dateB = new Date(b.data.split('/').reverse().join('-'));
                return dateA.getTime() - dateB.getTime();
              });
              
            console.log('📊 Dados diários agregados finais:', dadosDiariosGerais);
          } catch (error) {
            console.error('💥 Erro ao buscar dados diários:', error);
          }
        } else {
          console.log('⚠️ Nenhum projeto encontrado para buscar dados diários');
        }
        
        setDashboardData({
          ...dashboardData,
          dados_diarios: dadosDiariosGerais,
          metricas_totais: metricasTotaisConsolidadas
        });

        // Buscar dashboard para cada projeto individualmente  
        if (projetosData.length > 0) {
          const projetoDashboardPromises = projetosData.map(async (projeto: Projeto) => {
            try {
              const [dashboardResponse, relatosResponse] = await Promise.all([
                fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.DAILY_REPORTS)}/dashboard/consolidado?projeto_id=${projeto.id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.DAILY_REPORTS)}/projeto/${projeto.id}/ultimos?limit=30`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
              ]);
              
              if (dashboardResponse.ok && relatosResponse.ok) {
                const dashboardData = await dashboardResponse.json();
                const relatosData = await relatosResponse.json();
                
                // Converter dados diários para formato do gráfico
                const dadosDiarios = relatosData.reverse().map((relatorio: {
                  data_referente: string;
                  registros?: number;
                  ftd?: number;
                  leads?: number;
                }) => ({
                  data: new Date(relatorio.data_referente).toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit' 
                  }),
                  registros: relatorio.registros || 0,
                  depositos: relatorio.ftd || 0, // FTD representa novos depositantes
                  leads: relatorio.leads || 0,
                  ftd: relatorio.ftd || 0
                }));
                
                return { 
                  [projeto.id]: {
                    ...dashboardData,
                    dados_diarios: dadosDiarios
                  }
                };
              }
            } catch (error) {
              console.error(`Erro ao buscar dashboard do projeto ${projeto.id}:`, error);
            }
            return null;
          });
          
          const dashboardResults = await Promise.all(projetoDashboardPromises);
          const dashboardsObj = dashboardResults
            .filter((result): result is {[key: string]: DashboardFinanceiro} => result !== null)
            .reduce((acc, curr) => {
              return { ...acc, ...curr };
            }, {} as {[key: string]: DashboardFinanceiro});
          setProjetoDashboards(dashboardsObj);

          // Buscar dados de redes sociais para cada projeto
          const redesSociaisPromises = projetosData.map(async (projeto: Projeto) => {
            try {
              const [estatisticasResponse, metricasResponse] = await Promise.all([
                fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.SOCIAL_METRICS)}/projeto/${projeto.id}/estatisticas`, {
                  headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.SOCIAL_METRICS)}/projeto/${projeto.id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
              ]);

              let estatisticas = null;
              let metricas: MetricasRedesSociais[] = [];

              if (estatisticasResponse.ok) {
                estatisticas = await estatisticasResponse.json();
              }

              if (metricasResponse.ok) {
                metricas = await metricasResponse.json();
              }

              return {
                [projeto.id]: {
                  estatisticas,
                  metricas
                }
              };
            } catch (error) {
              console.error(`Erro ao buscar redes sociais do projeto ${projeto.id}:`, error);
              return {
                [projeto.id]: {
                  estatisticas: null,
                  metricas: []
                }
              };
            }
          });

          const redesSociaisResults = await Promise.all(redesSociaisPromises);
          const redesSociaisObj = redesSociaisResults.reduce((acc, curr) => {
            return { ...acc, ...curr };
          }, {} as {[key: string]: {estatisticas: EstatisticasRedesSociais, metricas: MetricasRedesSociais[]}});
          setProjetoRedesSociais(redesSociaisObj);
        }
      } else {
        throw new Error('Erro ao carregar dados financeiros');
      }

      if (atividadesResponse.ok) {
        const atividadesData = await atividadesResponse.json();
        const atividadesArray = Array.isArray(atividadesData) ? atividadesData : [];
        
        // Processar resumo das atividades
        const summary: AtividadesSummary = {
          total: atividadesArray.length,
          concluidas: atividadesArray.filter(a => a.status === 'Concluída').length,
          em_andamento: atividadesArray.filter(a => a.status === 'Em Andamento').length,
          pendentes: atividadesArray.filter(a => a.status === 'Pendente').length,
          urgentes: atividadesArray.filter(a => a.prioridade === 'Urgente').length,
          por_status: [
            { name: 'Concluídas', value: atividadesArray.filter(a => a.status === 'Concluída').length, color: '#10b981' },
            { name: 'Em Andamento', value: atividadesArray.filter(a => a.status === 'Em Andamento').length, color: '#3b82f6' },
            { name: 'Pendentes', value: atividadesArray.filter(a => a.status === 'Pendente').length, color: '#f59e0b' },
            { name: 'Canceladas', value: atividadesArray.filter(a => a.status === 'Cancelada').length, color: '#ef4444' }
          ]
        };
        setAtividadesSummary(summary);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const renderDashboardContent = (data: DashboardFinanceiro | null, isProject: boolean = false, projectId?: string) => {
    if (!data) return null;

    const { dados_diarios, metricas_totais } = data;
    const redesSociaisData = projectId ? projetoRedesSociais[projectId] : null;
    
    // Calcular período dos dados
    const hoje = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(hoje.getDate() - 30);
    
    const periodoTexto = `${dataInicio.toLocaleDateString('pt-BR')} - ${hoje.toLocaleDateString('pt-BR')}`;
    const ultimaAtualizacao = new Date().toLocaleString('pt-BR');

    return (
      <div className="space-y-8">
        {/* Informações sobre o Período dos Dados */}
        <div className="flex items-center justify-center mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">📊 Período analisado:</span> {periodoTexto} (últimos 30 dias)
          </p>
        </div>
        
        {/* Acesso Rápido aos Relatórios - apenas nos projetos */}
        {isProject && projectId && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200 dark:border-blue-800">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <FileBarChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Relatórios Diários - Acesso Rápido
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Acesse rapidamente os relatórios de performance
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => {
                      // Buscar o relatório mais recente e redirecionar
                      fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.DAILY_REPORTS)}/projeto/${projectId}/ultimos?limit=1`, {
                        headers: { Authorization: `Bearer ${token}` }
                      })
                      .then(response => response.json())
                      .then(data => {
                        if (data && data.length > 0) {
                          window.location.href = `/projects/${projectId}/relatorios-diarios/${data[0].id}`;
                        } else {
                          alert('Nenhum relatório encontrado para este projeto');
                        }
                      })
                      .catch(error => {
                        console.error('Erro ao buscar relatório:', error);
                        alert('Erro ao buscar relatório mais recente');
                      });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
                  >
                    <FileBarChart className="mr-2 h-4 w-4" />
                    📊 Relatório Hoje
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      window.location.href = `/projects/${projectId}/relatorios-diarios`;
                    }}
                    className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    📅 Todos Relatórios
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      window.location.href = `/projects/${projectId}/relatorios-diarios/new`;
                    }}
                    className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/30"
                  >
                    <FileBarChart className="mr-2 h-4 w-4" />
                    ➕ Novo Relatório
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Parte 1: Cards Principais */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <InfoCard 
            title="Registros"
            value={metricas_totais.total_registros.toLocaleString('pt-BR')}
            icon={UsersIcon}
            subtitle="Total de registros"
            iconColor="text-blue-600"
          />
          <InfoCard 
            title="Depósitos"
            value={metricas_totais.total_depositos?.toLocaleString('pt-BR') || '0'}
            icon={WalletIcon}
            subtitle="Quantidade de depósitos"
            iconColor="text-green-600"
          />
          <InfoCard 
            title="Total Depósito"
            value={`R$ ${(metricas_totais.total_valor_depositos || 0).toLocaleString('pt-BR')}`}
            icon={CoinsIcon}
            subtitle="Valor total depositado"
            iconColor="text-purple-600"
          />
          <InfoCard 
            title="Revshare"
            value={`R$ ${(metricas_totais.revshare || 0).toLocaleString('pt-BR')}`}
            icon={TrendingUpIcon}
            subtitle="Receita compartilhada"
            iconColor="text-orange-600"
          />
        </div>

        {/* Parte 2: Gráficos de Evolução */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-1 lg:grid-cols-3">
          {/* Evolução de Registros */}
          <Card className="w-full min-w-0">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <LineChartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Evolução Diária de Registros</span>
              </CardTitle>
              {/* Botão de acesso rápido ao relatório mais recente - apenas nos projetos */}
              {isProject && projectId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Buscar o relatório mais recente e redirecionar
                    fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.DAILY_REPORTS)}/projeto/${projectId}/ultimos?limit=1`, {
                      headers: { Authorization: `Bearer ${token}` }
                    })
                    .then(response => response.json())
                    .then(data => {
                      if (data && data.length > 0) {
                        window.location.href = `/projects/${projectId}/relatorios-diarios/${data[0].id}`;
                      } else {
                        alert('Nenhum relatório encontrado para este projeto');
                      }
                    })
                    .catch(error => {
                      console.error('Erro ao buscar relatório:', error);
                      alert('Erro ao buscar relatório mais recente');
                    });
                  }}
                  className="flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm"
                >
                  <FileBarChart className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Relatório Hoje</span>
                  <span className="sm:hidden">Relatório</span>
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ChartContainer config={{
                registros: { label: "Registros", color: "#3b82f6" }
              }} className="h-[250px] sm:h-[300px] w-full">
                {dados_diarios && dados_diarios.length > 0 ? (
                  <LineChart data={dados_diarios} margin={{ top: 5, right: 5, left: 5, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="data" 
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis fontSize={10} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="registros" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 2 }}
                    />
                  </LineChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">Nenhum dado disponível para o período</p>
                  </div>
                )}
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Evolução de Depósitos */}
          <Card className="w-full min-w-0">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <LineChartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Evolução Diária de FTD</span>
              </CardTitle>
              {/* Botão para ver todos os relatórios - apenas nos projetos */}
              {isProject && projectId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    window.location.href = `/projects/${projectId}/relatorios-diarios`;
                  }}
                  className="flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm"
                >
                  <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Todos Relatórios</span>
                  <span className="sm:hidden">Todos</span>
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ChartContainer config={{
                depositos: { label: "FTD (Novos Depositantes)", color: "#10b981" }
              }} className="h-[250px] sm:h-[300px] w-full">
                {dados_diarios && dados_diarios.length > 0 ? (
                  <LineChart data={dados_diarios} margin={{ top: 5, right: 5, left: 5, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="data" 
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis fontSize={10} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="depositos" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 2 }}
                    />
                  </LineChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">Nenhum dado disponível para o período</p>
                  </div>
                )}
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Evolução de Valor de Depósitos */}
          <Card className="w-full min-w-0">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <WalletIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <div className="flex flex-col">
                  <span className="text-sm sm:text-base">Evolução de Depósitos (R$)</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Estimativa baseada em FTD × R$ 150
                  </span>
                </div>
              </CardTitle>
              {/* Botão para criar novo relatório - apenas nos projetos */}
              {isProject && projectId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    window.location.href = `/projects/${projectId}/relatorios-diarios/new`;
                  }}
                  className="flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm"
                >
                  <FileBarChart className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Novo Relatório</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ChartContainer config={{
                valor_depositos: { label: "Valor Depositado (R$)", color: "#8b5cf6" }
              }} className="h-[250px] sm:h-[300px] w-full">
                {dados_diarios && dados_diarios.length > 0 ? (
                  <LineChart data={dados_diarios.map(item => ({
                    ...item,
                    // Simular valor de depósito baseado em FTD (média R$ 150 por FTD)
                    valor_depositos: (item.depositos * 150) || 0
                  }))} margin={{ top: 5, right: 5, left: 5, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="data" 
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis 
                      fontSize={10}
                      tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent 
                        formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor Depositado']}
                      />} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="valor_depositos" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 2 }}
                    />
                  </LineChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">Nenhum dado disponível para o período</p>
                  </div>
                )}
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Parte 3: Relatório de Atividades (apenas no dashboard geral) */}
        {!isProject && atividadesSummary && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <ActivityIcon className="h-5 w-5" />
              Atividades
            </h3>
            
            <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
              {/* Resumo das Atividades */}
              <Card className="xl:col-span-1">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ActivityIcon className="h-5 w-5" />
                    Resumo de Atividades
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{atividadesSummary.total}</p>
                    <p className="text-sm text-muted-foreground">Total de Atividades</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Concluídas</span>
                      </div>
                      <Badge variant="default" className="bg-green-600">{atividadesSummary.concluidas}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Em Andamento</span>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">{atividadesSummary.em_andamento}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <AlertTriangleIcon className="h-4 w-4 text-amber-600" />
                        <span className="text-sm">Pendentes</span>
                      </div>
                      <Badge variant="outline" className="border-amber-300 text-amber-600">{atividadesSummary.pendentes}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <AlertTriangleIcon className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Urgentes</span>
                      </div>
                      <Badge variant="destructive">{atividadesSummary.urgentes}</Badge>
                    </div>
                  </div>

                  <Link href="/atividades">
                    <Button variant="outline" className="w-full">
                      Ver Todas Atividades
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Gráfico de Status das Atividades */}
              <Card className="xl:col-span-2">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <PieChartIcon className="h-5 w-5" />
                    Distribuição por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                    <div className="flex justify-center">
                      <ChartContainer config={{}} className="h-[240px] w-full max-w-[240px]">
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Pie
                            data={atividadesSummary.por_status}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            nameKey="name"
                          >
                            {atividadesSummary.por_status.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                    </div>
                    
                    <div className="space-y-3">
                      {atividadesSummary.por_status.map((item) => (
                        <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Parte 4: Métricas de Redes Sociais (apenas nos projetos) */}
        {isProject && redesSociaisData && redesSociaisData.estatisticas && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Redes Sociais
            </h3>
            
            {/* Cards de Estatísticas das Redes Sociais */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Instagram */}
              {redesSociaisData.estatisticas.total_seguidores_instagram && (
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Instagram</p>
                        <p className="text-xl font-bold text-purple-600">
                          {redesSociaisData.estatisticas.total_seguidores_instagram.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">Seguidores</p>
                      </div>
                      <Instagram className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Telegram */}
              {redesSociaisData.estatisticas.total_inscritos_telegram && (
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Telegram</p>
                        <p className="text-xl font-bold text-blue-600">
                          {redesSociaisData.estatisticas.total_inscritos_telegram.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">Inscritos</p>
                      </div>
                      <MessageCircle className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* WhatsApp */}
              {redesSociaisData.estatisticas.total_leads_whatsapp && (
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
                        <p className="text-xl font-bold text-green-600">
                          {redesSociaisData.estatisticas.total_leads_whatsapp.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                      <MessageCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Facebook */}
              {redesSociaisData.estatisticas.total_seguidores_facebook && (
                <Card className="border-l-4 border-l-indigo-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Facebook</p>
                        <p className="text-xl font-bold text-indigo-600">
                          {redesSociaisData.estatisticas.total_seguidores_facebook.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">Seguidores</p>
                      </div>
                      <Facebook className="h-8 w-8 text-indigo-500" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* YouTube */}
              {redesSociaisData.estatisticas.total_inscritos_youtube && (
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">YouTube</p>
                        <p className="text-xl font-bold text-red-600">
                          {redesSociaisData.estatisticas.total_inscritos_youtube.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">Inscritos</p>
                      </div>
                      <Youtube className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* TikTok */}
              {redesSociaisData.estatisticas.total_seguidores_tiktok && (
                <Card className="border-l-4 border-l-gray-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">TikTok</p>
                        <p className="text-xl font-bold text-gray-600">
                          {redesSociaisData.estatisticas.total_seguidores_tiktok.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">Seguidores</p>
                      </div>
                      <MessageCircle className="h-8 w-8 text-gray-500" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Gráfico de Evolução das Redes Sociais */}
            {redesSociaisData.metricas && redesSociaisData.metricas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5" />
                    Evolução das Redes Sociais (Últimos 15 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{
                    seguidores_instagram: { label: "Instagram", color: "#8b5cf6" },
                    inscritos_telegram: { label: "Telegram", color: "#3b82f6" },
                    leads_whatsapp: { label: "WhatsApp", color: "#10b981" }
                  }} className="h-[300px]">
                    {redesSociaisData.metricas.length > 0 ? (
                      <LineChart data={redesSociaisData.metricas.slice(-15).map(m => ({
                        data: new Date(m.data_referente).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        seguidores_instagram: m.seguidores_instagram || 0,
                        inscritos_telegram: m.inscritos_telegram || 0,
                        leads_whatsapp: m.leads_whatsapp || 0
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="data" 
                          fontSize={12}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="seguidores_instagram" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="inscritos_telegram" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="leads_whatsapp" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                        />
                      </LineChart>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Nenhum dado disponível para o período</p>
                      </div>
                    )}
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard de Projetos</h1>
          <div className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Carregando dados...</span>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard de Projetos</h1>
          <Button onClick={fetchData} variant="outline">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangleIcon className="mx-auto h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {error || 'Nenhum dado encontrado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {error ? 'Ocorreu um erro ao carregar os dados.' : 'Não há dados disponíveis ainda.'}
              </p>
              <Button onClick={fetchData} variant="outline">
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-full overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: hideScrollbarStyles }} />
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard de Projetos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Análise consolidada dos projetos e relatórios diários
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={fetchData} variant="outline" size="sm" className="w-full sm:w-auto">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Link href="/projects" className="w-full sm:w-auto">
            <Button size="sm" className="w-full">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Ver Projetos
            </Button>
          </Link>
        </div>
      </div>

      {/* Custom Tab Navigation */}
      <div className="w-full overflow-hidden">
        <div className="flex gap-2 border-b mb-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('geral')}
            className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'geral'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Dashboard Geral
          </button>
          {projetos.map((projeto) => {
            console.log('🎯 Renderizando tab para projeto:', projeto);
            return (
              <button
                key={projeto.id}
                onClick={() => setActiveTab(projeto.id)}
                className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === projeto.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {projeto.name}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'geral' && (
          <div className="mt-6">
            {renderDashboardContent(dashboardData)}
          </div>
        )}
        
        {projetos.map((projeto) => (
          activeTab === projeto.id && (
            <div key={projeto.id} className="mt-6">
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-bold">{projeto.name}</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Status: <Badge variant={projeto.status === 'Ativo' ? 'default' : 'secondary'}>
                    {projeto.status}
                  </Badge>
                </p>
              </div>
              {renderDashboardContent(projetoDashboards[projeto.id], true, projeto.id)}
            </div>
          )
        ))}
      </div>
    </div>
  );
} 