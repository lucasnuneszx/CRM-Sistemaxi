"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, UserIcon, FolderIcon, MoreVerticalIcon, TrendingUpIcon, Trash } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from '@/config/api';
import { toast } from "sonner";

interface Project {
  id: string; // UUID
  name: string;
  title?: string; // Para compatibilidade
  description: string | null;
  status: string;
  owner_id: string; // UUID
  created_at: string;
  updated_at: string | null;
  owner?: {
    id: string;
    name: string;
    username?: string;
    email: string;
  };
  cliente?: {
    id: string;
    nome: string;
    email?: string;
  };
}

export default function ProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  // Função para buscar projetos (extraída para reutilização)
  const fetchProjects = useCallback(async () => {
    if (!token || token.length < 10) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS_V1), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar projetos');
      }

      const data = await response.json();
      
      // Usar dados da API se for array, caso contrário array vazio
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Excluir projeto
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir navegação ao clicar no botão
    
    const projectToDelete = projects.find(p => p.id === id);
    const projectName = projectToDelete?.name || projectToDelete?.title || 'este projeto';
    
    // Mostrar toast de confirmação
    toast.warning(`Excluir "${projectName}"?`, {
      description: "Esta ação não pode ser desfeita.",
      action: {
        label: "Excluir",
        onClick: async () => {
          setError(null);
          setSuccessMessage(null);
          
          try {
            const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS_V1)}/${id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              mode: 'cors',
              credentials: 'omit',
            });

            if (!response.ok) {
              let errorMessage = 'Erro ao excluir projeto';
              try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorData.error || errorMessage;
              } catch {
                errorMessage = `Erro ${response.status}: ${response.statusText}`;
              }
              
              // Mostrar toast de erro
              toast.error("Erro ao excluir projeto", {
                description: errorMessage,
              });
              return;
            }

            // Atualizar a lista automaticamente removendo o projeto excluído
            setProjects(prevProjects => prevProjects.filter(project => project.id !== id));
            
            // Recarregar lista completa para garantir sincronização
            await fetchProjects();
            
            toast.success(`Projeto "${projectName}" excluído com sucesso!`);
          } catch (err) {
            console.error('Erro ao excluir projeto:', err);
            const errorMsg = err instanceof Error ? err.message : 'Erro ao excluir projeto';
            toast.error("Erro ao excluir projeto", {
              description: errorMsg,
            });
          }
        },
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {},
      },
      duration: 5000,
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "planning":
        return { label: "Planejamento", progress: 10, variant: "outline" as const };
      case "active":
        return { label: "Ativo", progress: 50, variant: "default" as const };
      case "paused":
        return { label: "Pausado", progress: 70, variant: "secondary" as const };
      case "completed":
        return { label: "Concluído", progress: 100, variant: "default" as const };
      default:
        return { label: "Indefinido", progress: 0, variant: "outline" as const };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Data inválida";
      }
      return date.toLocaleDateString("pt-BR", {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Erro ao formatar data:", error, dateString);
      return "Data inválida";
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe todos os seus projetos
          </p>
        </div>
        <Button onClick={() => router.push("/projects/new")} size="lg">
          <FolderIcon className="mr-2 h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const statusConfig = getStatusConfig(project.status);
              return (
                <Card key={project.id} className="transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                      <CardAction>
                        <Button variant="ghost" size="icon">
                          <MoreVerticalIcon className="h-4 w-4" />
                        </Button>
                      </CardAction>
                    </div>
                    <CardTitle className="group cursor-pointer hover:text-primary transition-colors" 
                              onClick={() => router.push(`/projects/${project.id}`)}>
                      {project.name || project.title}
                    </CardTitle>
                    <CardDescription>
                      {project.description || "Nenhuma descrição disponível"}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <TrendingUpIcon className="h-3 w-3" />
                          Progresso
                        </span>
                        <span className="font-medium">{statusConfig.progress}%</span>
                      </div>
                      <Progress value={statusConfig.progress} className="h-2" />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          <span className="text-xs font-medium uppercase tracking-wide">Criado</span>
                        </div>
                        <p className="text-sm font-medium">{formatDate(project.created_at)}</p>
                        {project.owner && (
                          <p className="text-xs text-muted-foreground">
                            Criado por: {project.owner.name || project.owner.username || project.owner.email}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <UserIcon className="h-3 w-3" />
                          <span className="text-xs font-medium uppercase tracking-wide">Proprietário</span>
                        </div>
                        {project.cliente ? (
                          <p className="text-sm font-medium">{project.cliente.nome}</p>
                        ) : project.owner ? (
                          <p className="text-sm font-medium">{project.owner.name || project.owner.username || project.owner.email}</p>
                        ) : (
                          <p className="text-sm font-medium">Usuário {project.owner_id}</p>
                        )}
                      </div>
                    </div>

                    {project.updated_at && (
                      <>
                        <Separator />
                        <p className="text-xs text-muted-foreground">
                          Última atualização: {formatDate(project.updated_at)}
                        </p>
                      </>
                    )}
                  </CardContent>
                  
                  <CardFooter className="gap-2">
                    <Button 
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="flex-1"
                    >
                      Ver Detalhes
                    </Button>
                    <Button 
                      onClick={() => router.push(`/projects/${project.id}/edit`)}
                      variant="outline"
                      size="icon"
                    >
                      <UserIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={(e) => handleDelete(project.id, e)}
                      variant="outline"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Visão Geral dos Projetos</CardTitle>
              <CardDescription>
                Lista completa de todos os projetos com informações detalhadas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {error && (
                <Alert variant="destructive" className="m-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="m-4 bg-green-900/50 border-green-500">
                  <AlertDescription className="text-green-200">{successMessage}</AlertDescription>
                </Alert>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => {
                    const statusConfig = getStatusConfig(project.status);
                    return (
                      <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50"
                                onClick={() => router.push(`/projects/${project.id}`)}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium leading-none">{project.name || project.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {project.description?.slice(0, 50)}
                              {project.description && project.description.length > 50 ? "..." : ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant} className="text-xs">
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Progress value={statusConfig.progress} className="h-1 w-16" />
                              <span className="text-xs font-medium">{statusConfig.progress}%</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(project.created_at)}</TableCell>
                        <TableCell className="text-sm">
                          {project.updated_at ? formatDate(project.updated_at) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/projects/${project.id}`);
                              }}
                            >
                              Ver
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/projects/${project.id}/edit`);
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDelete(project.id, e)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 