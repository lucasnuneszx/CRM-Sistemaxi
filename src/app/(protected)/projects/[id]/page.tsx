"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CalendarIcon, Users, DollarSign, ArrowLeft, Edit, Trash2, ListChecks, PlusCircle, CheckCircle, Clock, AlertTriangle, XCircle, Target, Zap, AlertCircle, Building2, FileBarChart, Lock, Key, Mail, MessageCircle, Facebook, Plus, Instagram, Youtube } from "lucide-react";
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from '@/config/api';
import { UserProjectManager } from "@/components/projects/UserProjectManager";

// Interface para o usuário aninhado (responsável pela atividade)
interface UserNested {
  id: string; // UUID
  username: string;
  email: string;
}

// Interface para estatísticas dos relatórios diários
interface EstatisticasRelatorio {
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

// Interface para estatísticas de redes sociais
interface EstatisticasRedesSociais {
  total_registros: number;
  total_seguidores_instagram?: number;
  total_inscritos_telegram?: number;
  total_leads_whatsapp?: number;
  total_seguidores_facebook?: number;
  total_inscritos_youtube?: number;
  total_seguidores_tiktok?: number;
}

// Interface para métricas de redes sociais
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

// Interface para Atividade
interface Atividade {
  id: string; // UUID
  nome: string;
  descricao?: string | null;
  status: string;
  prazo?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  prioridade: string;
  projeto_id: string; // UUID
  responsavel_id?: string | null; // UUID
  setor_id?: string | null; // UUID
  created_at: string;
  updated_at?: string | null;
  projeto?: { id: string; name: string };
  responsavel?: UserNested | null;
  setor?: { id: string; nome: string } | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string | null;
  budget: string;
  owner_id: string;
  created_at: string;
  updated_at: string | null;
  atividades?: Atividade[];
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { token } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [estatisticasRelatorio, setEstatisticasRelatorio] = useState<EstatisticasRelatorio | null>(null);
  const [estatisticasRedesSociais, setEstatisticasRedesSociais] = useState<EstatisticasRedesSociais | null>(null);
  const [metricasRedesSociais, setMetricasRedesSociais] = useState<MetricasRedesSociais[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const router = useRouter();

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS_V1)}/${resolvedParams.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: "Projeto não encontrado ou erro na resposta." }));
          throw new Error(errorData.detail || "Falha ao buscar projeto");
        }
        const data = await response.json();
        const projectData: Project = {
          ...data,
          atividades: data.atividades || []
        };
        setProject(projectData);
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchEstatisticasRelatorio = async () => {
      try {
        const response = await fetch(
          `${buildApiUrl(API_CONFIG.ENDPOINTS.DAILY_REPORTS)}/projeto/${resolvedParams.id}/estatisticas`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setEstatisticasRelatorio(data);
        }
      } catch (error) {
        console.error("Error fetching relatórios statistics:", error);
      }
    };

    const fetchMetricasRedesSociais = async () => {
      try {
        const [metricasResponse, estatisticasResponse] = await Promise.all([
                        fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.SOCIAL_METRICS)}/projeto/${resolvedParams.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }),
                      fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.SOCIAL_METRICS)}/projeto/${resolvedParams.id}/estatisticas`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          })
        ]);

        if (metricasResponse.ok) {
          const metricasData = await metricasResponse.json();
          setMetricasRedesSociais(metricasData);
        }

        if (estatisticasResponse.ok) {
          const estatisticasData = await estatisticasResponse.json();
          setEstatisticasRedesSociais(estatisticasData);
        }
      } catch (error) {
        console.error("Error fetching redes sociais data:", error);
      }
    };

    if (token && resolvedParams.id) {
      Promise.all([fetchProject(), fetchEstatisticasRelatorio(), fetchMetricasRedesSociais()]);
    }
  }, [resolvedParams.id, token]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "planning":
      case "planejamento":
        return "bg-blue-500 text-blue-foreground";
      case "active":
      case "ativo":
        return "bg-green-500 text-green-foreground";
      case "paused":
      case "pausado":
        return "bg-yellow-500 text-yellow-foreground";
      case "completed":
      case "concluído":
        return "bg-gray-500 text-gray-foreground";
      default:
        return "bg-slate-500 text-slate-foreground";
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return "N/A";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numericAmount);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) throw new Error("Invalid date value from string");
      return date.toLocaleDateString("pt-BR", {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch (errorParsingDate) {
      console.error("Error formatting date:", dateString, errorParsingDate);
      return "Data inválida";
    }
  };

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja excluir este projeto?")) {
      try {
        const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS_V1)}/${resolvedParams.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          router.push("/projects");
        } else {
          const errorData = await response.json().catch(() => ({ detail: "Erro ao excluir o projeto" }));
          alert(errorData.detail || "Erro ao excluir o projeto");
        }
      } catch (error) {
        console.error("Error deleting project:", error);
        alert("Erro ao excluir o projeto");
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/4 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Projeto não encontrado</CardTitle>
            <CardDescription>O projeto solicitado não existe ou foi removido, ou você não tem permissão para visualizá-lo.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Não foi possível encontrar o projeto com o ID: {resolvedParams.id}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/projects")}>Ver Todos os Projetos</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Helper para status de atividade
  const getActivityStatusBadge = (status: string) => {
    let colorClass = "bg-gray-200";
    let textColor = "text-gray-800";
    switch (status?.toLowerCase()) {
      case "não iniciada":
        colorClass = "bg-blue-100";
        textColor = "text-blue-800";
        break;
      case "em andamento":
      case "em desenvolvimento":
        colorClass = "bg-yellow-100";
        textColor = "text-yellow-800";
        break;
      case "concluída":
        colorClass = "bg-green-100";
        textColor = "text-green-800";
        break;
      case "atrasada":
        colorClass = "bg-red-100";
        textColor = "text-red-800";
        break;
      case "pendente":
        colorClass = "bg-purple-100";
        textColor = "text-purple-800";
        break;
    }
    return <Badge className={`${colorClass} ${textColor} px-2 py-1 text-xs font-medium`}>{status || "Indefinido"}</Badge>;
  };

  // Funções para calcular estatísticas das atividades
  const getActivityStats = () => {
    if (!project.atividades) return {
      total: 0,
      concluidas: 0,
      emAndamento: 0,
      atrasadas: 0,
      naoIniciadas: 0,
      prioridadeAlta: 0,
      prioridadeMedia: 0,
      prioridadeBaixa: 0,
      prioridadeUrgente: 0
    };

    const atividades = project.atividades;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return {
      total: atividades.length,
      concluidas: atividades.filter(a => a.status.toLowerCase() === 'concluída').length,
      emAndamento: atividades.filter(a => a.status.toLowerCase() === 'em andamento' || a.status.toLowerCase() === 'em desenvolvimento').length,
      atrasadas: atividades.filter(a => {
        if (!a.prazo || a.status.toLowerCase() === 'concluída') return false;
        const prazo = new Date(a.prazo);
        prazo.setHours(0, 0, 0, 0);
        return prazo < hoje;
      }).length,
      naoIniciadas: atividades.filter(a => a.status.toLowerCase() === 'não iniciada').length,
      prioridadeAlta: atividades.filter(a => a.prioridade?.toLowerCase() === 'alta').length,
      prioridadeMedia: atividades.filter(a => a.prioridade?.toLowerCase() === 'média').length,
      prioridadeBaixa: atividades.filter(a => a.prioridade?.toLowerCase() === 'baixa').length,
      prioridadeUrgente: atividades.filter(a => a.prioridade?.toLowerCase() === 'urgente').length
    };
  };

  const stats = getActivityStats();

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => router.push(`/projects/${project.id}/relatorios-diarios`)}
            className="flex-1 sm:flex-none"
          >
            <FileBarChart className="mr-2 h-4 w-4" /> 
            <span className="hidden sm:inline">Relatórios Diários</span>
            <span className="sm:hidden">Relatórios</span>
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => router.push(`/projects/${project.id}/casas-parceiras`)}
            className="flex-1 sm:flex-none"
          >
            <Building2 className="mr-2 h-4 w-4" /> 
            <span className="hidden sm:inline">Casas Parceiras</span>
            <span className="sm:hidden">Casas</span>
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => router.push(`/projects/${project.id}/edit`)}
            className="flex-1 sm:flex-none"
          >
            <Edit className="mr-2 h-4 w-4" /> 
            <span className="hidden sm:inline">Editar</span>
            <span className="sm:hidden">Edit</span>
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDelete}
            className="flex-1 sm:flex-none"
          >
            <Trash2 className="mr-2 h-4 w-4" /> 
            <span className="hidden sm:inline">Excluir</span>
            <span className="sm:hidden">Del</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-4">
          <TabsTrigger value="details" className="flex items-center justify-center px-2 text-xs sm:text-sm">
            <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
            <span className="hidden sm:inline">Detalhes</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center justify-center px-2 text-xs sm:text-sm">
            <ListChecks className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
            <span className="hidden sm:inline">Atividades ({project.atividades?.length || 0})</span>
            <span className="sm:hidden">Ativ ({project.atividades?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center justify-center px-2 text-xs sm:text-sm">
            <Key className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
            <span className="hidden sm:inline">Usuários</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center justify-center px-2 text-xs sm:text-sm">
            <MessageCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
            <span className="hidden sm:inline">Redes Sociais</span>
            <span className="sm:hidden">Social</span>
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center justify-center px-2 text-xs sm:text-sm">
            <Lock className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
            <span className="hidden sm:inline">Credenciais</span>
            <span className="sm:hidden">Cred</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center justify-center px-2 text-xs sm:text-sm">
            <FileBarChart className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
            <span className="hidden sm:inline">Relatórios</span>
            <span className="sm:hidden">Rel</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="space-y-6">
            {/* Header com informações principais do projeto */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Informações principais */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-3xl break-all mb-3">{project.name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        {project.status && (
                          <Badge variant="outline" className={`${getStatusColor(project.status)} px-3 py-1 text-sm font-medium`}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </Badge>
                        )}
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          <span>Criado em {formatDate(project.created_at)}</span>
                        </div>
                        {project.updated_at && project.updated_at !== project.created_at && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Edit className="h-4 w-4 mr-2" />
                            <span>Atualizado em {formatDate(project.updated_at)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {project.description || "Sem descrição disponível para este projeto."}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Progresso visual */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Progresso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <Progress 
                        value={project.status.toLowerCase() === 'concluído' || project.status.toLowerCase() === 'completed' ? 100 : (project.status.toLowerCase() === 'ativo' || project.status.toLowerCase() === 'active' ? 50 : (project.atividades && project.atividades.length > 0 ? (project.atividades.filter(a => a.status.toLowerCase() === 'concluída').length / project.atividades.length) * 100 : 0) ) } 
                        className="h-3 rotate-0" 
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                        {Math.round(project.status.toLowerCase() === 'concluído' || project.status.toLowerCase() === 'completed' ? 100 : (project.status.toLowerCase() === 'ativo' || project.status.toLowerCase() === 'active' ? 50 : (project.atividades && project.atividades.length > 0 ? (project.atividades.filter(a => a.status.toLowerCase() === 'concluída').length / project.atividades.length) * 100 : 0) ) )}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Conclusão Estimada</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informações detalhadas em cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Data de Início */}
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Início</p>
                      <p className="text-lg font-bold">{formatDate(project.startDate)}</p>
                    </div>
                    <CalendarIcon className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              {/* Data de Término */}
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Término</p>
                      <p className="text-lg font-bold">{formatDate(project.endDate)}</p>
                    </div>
                    <CalendarIcon className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              {/* Orçamento */}
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Orçamento</p>
                      <p className="text-lg font-bold">{formatCurrency(project.budget || 0)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              {/* Total de Atividades */}
              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Atividades</p>
                      <p className="text-2xl font-bold">{project.atividades?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.atividades?.filter(a => a.status.toLowerCase() === 'concluída').length || 0} concluídas
                      </p>
                    </div>
                    <ListChecks className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informações adicionais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">ID do Projeto:</span>
                    <p className="font-mono text-xs mt-1 p-2 bg-muted rounded break-all">{project.id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Proprietário:</span>
                    <p className="font-mono text-xs mt-1 p-2 bg-muted rounded break-all">{project.owner_id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle>Atividades do Projeto ({project.atividades?.length || 0})</CardTitle>
                    <CardDescription>
                        Lista de todas as atividades associadas a este projeto.
                    </CardDescription>
                </div>
                <Button 
                  size="sm"
                  onClick={() => router.push(`/atividades/new?projectId=${project.id}&projectName=${encodeURIComponent(project.name || "")}`)}
                  className="w-full sm:w-auto"
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> 
                    <span className="hidden sm:inline">Adicionar Atividade</span>
                    <span className="sm:hidden">Adicionar</span>
                </Button>
            </CardHeader>
            
            {/* Cards de Resumo das Atividades */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total de Atividades */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                      </div>
                      <ListChecks className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Atividades Concluídas */}
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                        <p className="text-2xl font-bold text-green-600">{stats.concluidas}</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.total > 0 ? Math.round((stats.concluidas / stats.total) * 100) : 0}% do total
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Atividades em Andamento */}
                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.emAndamento}</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.total > 0 ? Math.round((stats.emAndamento / stats.total) * 100) : 0}% do total
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Atividades Atrasadas */}
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Atrasadas</p>
                        <p className="text-2xl font-bold text-red-600">{stats.atrasadas}</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.total > 0 ? Math.round((stats.atrasadas / stats.total) * 100) : 0}% do total
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Segunda linha de cards - Prioridades */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Prioridade Urgente */}
                <Card className="border-l-4 border-l-red-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Urgente</p>
                        <p className="text-xl font-bold text-red-700">{stats.prioridadeUrgente}</p>
                      </div>
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                {/* Prioridade Alta */}
                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Alta</p>
                        <p className="text-xl font-bold text-orange-600">{stats.prioridadeAlta}</p>
                      </div>
                      <Zap className="h-6 w-6 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Prioridade Média */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Média</p>
                        <p className="text-xl font-bold text-blue-600">{stats.prioridadeMedia}</p>
                      </div>
                      <Target className="h-6 w-6 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Prioridade Baixa */}
                <Card className="border-l-4 border-l-gray-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Baixa</p>
                        <p className="text-xl font-bold text-gray-600">{stats.prioridadeBaixa}</p>
                      </div>
                      <XCircle className="h-6 w-6 text-gray-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <CardContent>
              {(!project.atividades || project.atividades.length === 0) ? (
                <div className="text-center text-muted-foreground py-10">
                  <ListChecks className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                  <p className="text-lg font-semibold">Nenhuma atividade encontrada.</p>
                  <p className="text-sm">Clique em &quot;Adicionar Atividade&quot; para começar.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">Nome da Atividade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.atividades.map((atividade) => (
                      <TableRow key={atividade.id}>
                        <TableCell className="font-medium break-all">{atividade.nome}</TableCell>
                        <TableCell>{getActivityStatusBadge(atividade.status)}</TableCell>
                        <TableCell>{atividade.responsavel?.username || "-"}</TableCell>
                        <TableCell>{atividade.prioridade || "-"}</TableCell>
                        <TableCell>{formatDate(atividade.prazo)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => router.push(`/atividades/${atividade.id}/edit`)} className="mr-2">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <div className="space-y-6">
            {/* Header */}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Métricas de Redes Sociais
                  </CardTitle>
                  <CardDescription>
                    Acompanhe o crescimento de seguidores e engajamento nas redes sociais
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/projects/${project.id}/metricas-redes-sociais/new`)}
                    className="flex-1 sm:flex-none"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Nova Métrica</span>
                    <span className="sm:hidden">Nova</span>
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => router.push(`/projects/${project.id}/metricas-redes-sociais`)}
                    className="flex-1 sm:flex-none"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Ver Todas</span>
                    <span className="sm:hidden">Todas</span>
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Cards de Estatísticas */}
            {estatisticasRedesSociais ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Instagram */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Instagram</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {estatisticasRedesSociais.total_seguidores_instagram?.toLocaleString('pt-BR') || '0'}
                        </p>
                        <p className="text-xs text-muted-foreground">Seguidores</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Instagram className="h-6 w-6 text-white" />
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
                          {estatisticasRedesSociais.total_inscritos_telegram?.toLocaleString('pt-BR') || '0'}
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
                          {estatisticasRedesSociais.total_leads_whatsapp?.toLocaleString('pt-BR') || '0'}
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
                          {estatisticasRedesSociais.total_seguidores_facebook?.toLocaleString('pt-BR') || '0'}
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
                          {estatisticasRedesSociais.total_inscritos_youtube?.toLocaleString('pt-BR') || '0'}
                        </p>
                        <p className="text-xs text-muted-foreground">Inscritos</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Youtube className="h-6 w-6 text-white" />
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
                          {estatisticasRedesSociais.total_seguidores_tiktok?.toLocaleString('pt-BR') || '0'}
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
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-20 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Gráficos de Evolução */}
            {metricasRedesSociais.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Gráfico Instagram */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Instagram className="h-5 w-5 text-purple-500" />
                      Evolução - Instagram
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{
                      seguidores_instagram: { label: "Seguidores", color: "#8b5cf6" }
                    }} className="h-[250px]">
                      <LineChart data={metricasRedesSociais.slice(-15).map(m => ({
                        data: new Date(m.data_referente).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        seguidores_instagram: m.seguidores_instagram || 0
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" fontSize={12} angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="seguidores_instagram" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }} />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Gráfico Telegram */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                      Evolução - Telegram
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{
                      inscritos_telegram: { label: "Inscritos", color: "#3b82f6" }
                    }} className="h-[250px]">
                      <LineChart data={metricasRedesSociais.slice(-15).map(m => ({
                        data: new Date(m.data_referente).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        inscritos_telegram: m.inscritos_telegram || 0
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" fontSize={12} angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="inscritos_telegram" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }} />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Gráfico WhatsApp */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-green-500" />
                      Evolução - WhatsApp
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{
                      leads_whatsapp: { label: "Leads", color: "#10b981" }
                    }} className="h-[250px]">
                      <LineChart data={metricasRedesSociais.slice(-15).map(m => ({
                        data: new Date(m.data_referente).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        leads_whatsapp: m.leads_whatsapp || 0
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" fontSize={12} angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="leads_whatsapp" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }} />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Gráfico YouTube */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Youtube className="h-5 w-5 text-red-500" />
                      Evolução - YouTube
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{
                      inscritos_youtube: { label: "Inscritos", color: "#ef4444" }
                    }} className="h-[250px]">
                      <LineChart data={metricasRedesSociais.slice(-15).map(m => ({
                        data: new Date(m.data_referente).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        inscritos_youtube: m.inscritos_youtube || 0
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" fontSize={12} angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="inscritos_youtube" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }} />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center text-muted-foreground">
                    <MessageCircle className="mx-auto h-16 w-16 mb-4 text-gray-400" />
                    <p className="text-xl font-semibold mb-2">Nenhuma métrica encontrada</p>
                    <p className="text-sm mb-6">
                      Ainda não há métricas de redes sociais para este projeto. 
                      Crie a primeira métrica para começar o acompanhamento.
                    </p>
                    <Button 
                      onClick={() => router.push(`/projects/${project.id}/metricas-redes-sociais/new`)}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeira Métrica
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="credentials">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Credenciais de Acesso
                </CardTitle>
                <CardDescription>
                  Gerencie senhas e acessos para plataformas do projeto
                </CardDescription>
              </div>
              <Button 
                onClick={() => router.push(`/projects/${project.id}/credenciais`)}
                className="w-full sm:w-auto"
              >
                <Key className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Gerenciar Credenciais</span>
                <span className="sm:hidden">Gerenciar</span>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Lock className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sistema de Credenciais</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Armazene com segurança senhas e informações de acesso para plataformas como Gmail, 
                  ManycChat, Facebook Ads, Google Ads e muito mais.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 max-w-2xl mx-auto">
                  <div className="flex flex-col items-center p-4 border rounded-lg">
                    <Mail className="h-8 w-8 text-blue-500 mb-2" />
                    <span className="text-sm font-medium">Gmail</span>
                  </div>
                  <div className="flex flex-col items-center p-4 border rounded-lg">
                    <MessageCircle className="h-8 w-8 text-green-500 mb-2" />
                    <span className="text-sm font-medium">ManycChat</span>
                  </div>
                  <div className="flex flex-col items-center p-4 border rounded-lg">
                    <Facebook className="h-8 w-8 text-blue-600 mb-2" />
                    <span className="text-sm font-medium">Facebook</span>
                  </div>
                  <div className="flex flex-col items-center p-4 border rounded-lg">
                    <Key className="h-8 w-8 text-purple-500 mb-2" />
                    <span className="text-sm font-medium">Outros</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground mb-6">
                  <p>✓ Senhas criptografadas com segurança</p>
                  <p>✓ Acesso rápido com um clique</p>
                  <p>✓ Organização por plataforma</p>
                  <p>✓ Busca e filtros avançados</p>
                </div>
                <Button 
                  onClick={() => router.push(`/projects/${project.id}/credenciais`)}
                  size="lg"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Começar a Usar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="space-y-6">
            {/* Header com botão para ver todos os relatórios */}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Relatórios Diários</CardTitle>
                  <CardDescription>
                    Resumo dos relatórios diários criados para este projeto
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/projects/${project.id}/relatorios-diarios/new`)}
                    className="flex-1 sm:flex-none"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Novo Relatório</span>
                    <span className="sm:hidden">Novo</span>
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => router.push(`/projects/${project.id}/relatorios-diarios`)}
                    className="flex-1 sm:flex-none"
                  >
                    <FileBarChart className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Ver Todos</span>
                    <span className="sm:hidden">Todos</span>
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Estatísticas dos Relatórios */}
            {estatisticasRelatorio ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total de Relatórios */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total de Relatórios</p>
                        <p className="text-3xl font-bold text-blue-600">{estatisticasRelatorio.total_relatorios}</p>
                      </div>
                      <FileBarChart className="h-10 w-10 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Total Investido */}
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Investido</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(estatisticasRelatorio.total_valor_investido)}
                        </p>
                      </div>
                      <DollarSign className="h-10 w-10 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Total Leads */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {estatisticasRelatorio.total_leads.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Users className="h-10 w-10 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Total Comissão */}
                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Comissão</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(estatisticasRelatorio.total_comissao)}
                        </p>
                      </div>
                      <Target className="h-10 w-10 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Total Registros */}
                <Card className="border-l-4 border-l-cyan-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Registros</p>
                        <p className="text-3xl font-bold text-cyan-600">
                          {estatisticasRelatorio.total_registros.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <CheckCircle className="h-10 w-10 text-cyan-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Total Depósito */}
                <Card className="border-l-4 border-l-indigo-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Depósito</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          {formatCurrency(estatisticasRelatorio.total_deposito)}
                        </p>
                      </div>
                      <Zap className="h-10 w-10 text-indigo-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Total FTDs */}
                <Card className="border-l-4 border-l-rose-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total FTDs</p>
                        <p className="text-3xl font-bold text-rose-600">
                          {estatisticasRelatorio.total_ftd.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <AlertCircle className="h-10 w-10 text-rose-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Custo Médio por Lead */}
                <Card className="border-l-4 border-l-teal-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Custo/Lead Médio</p>
                        <p className="text-xl font-bold text-teal-600">
                          {estatisticasRelatorio.media_custo_por_lead ? 
                            formatCurrency(estatisticasRelatorio.media_custo_por_lead) : 
                            'N/A'
                          }
                        </p>
                      </div>
                      <CalendarIcon className="h-10 w-10 text-teal-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center text-muted-foreground">
                    <FileBarChart className="mx-auto h-16 w-16 mb-4 text-gray-400" />
                    <p className="text-xl font-semibold mb-2">Nenhum relatório encontrado</p>
                    <p className="text-sm mb-6">
                      Ainda não há relatórios diários para este projeto. 
                      Crie o primeiro relatório para começar a acompanhar as métricas.
                    </p>
                    <Button 
                      onClick={() => router.push(`/projects/${project.id}/relatorios-diarios/new`)}
                      className="w-full sm:w-auto"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Criar Primeiro Relatório
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UserProjectManager projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 