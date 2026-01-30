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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Check, Trash2 } from "lucide-react";
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from '@/config/api';
import { toast } from "sonner";

interface TeamMember {
  id: string | number;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  budget: number | string;
  status: string;
}

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [projectUsers, setProjectUsers] = useState<any[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(true);
  const [addingUser, setAddingUser] = useState<string | null>(null);
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const [justAddedUser, setJustAddedUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!token) return;

    const fetchProject = async () => {
      try {
        const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS_V1)}/${resolvedParams.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        if (!response.ok) {
          if (response.status === 404) {
          throw new Error("Projeto não encontrado");
          }
          throw new Error(`Erro ao carregar projeto: ${response.status}`);
        }
        const project: Project = await response.json();
        
        setName(project.name);
        setDescription(project.description || "");
        // Format the date to YYYY-MM-DD for input[type=date]
        if (project.startDate) {
        setStartDate(project.startDate.split("T")[0]);
        }
        if (project.endDate) {
          setEndDate(project.endDate.split("T")[0]);
        }
        setBudget(project.budget?.toString() || "0");
        setStatus(project.status || "planning");
        
        // Buscar usuários do projeto separadamente
        try {
          const usersResponse = await fetch(buildApiUrl(`/v1/user-projects/projects/${resolvedParams.id}/users`), {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
          if (usersResponse.ok) {
            const projectUsersData = await usersResponse.json();
            if (Array.isArray(projectUsersData)) {
              setProjectUsers(projectUsersData);
            }
          }
        } catch (err) {
          console.error("Error fetching project users:", err);
          setProjectUsers([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching project:", error);
        setLoading(false);
        setError(error instanceof Error ? error.message : "Erro ao carregar projeto. Verifique a conexão com o servidor.");
      }
    };

    const fetchAllUsers = async () => {
      try {
        const usersResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USERS), {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setAllUsers(Array.isArray(usersData) ? usersData : []);
        } else {
          setAllUsers([]);
        }
        setLoadingTeamMembers(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setAllUsers([]);
        setLoadingTeamMembers(false);
      }
    };

    fetchProject();
    fetchAllUsers();
  }, [resolvedParams.id, token]);

  // Função para adicionar usuário ao projeto
  const addUserToProject = async (userId: string) => {
    if (!token) return;
    
    setAddingUser(userId);
    try {
      const response = await fetch(buildApiUrl(`/v1/user-projects/projects/${resolvedParams.id}/users`), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          role: "creative_user"
        })
      });

      if (response.ok) {
        // Encontrar o nome do usuário para exibir na notificação
        const user = allUsers.find((u: any) => String(u.id) === userId);
        const userName = user?.name || user?.username || user?.email || "usuário";
        
        // Marcar usuário como recém adicionado para animação
        setJustAddedUser(userId);
        
        // Recarregar lista de usuários do projeto
        const usersResponse = await fetch(buildApiUrl(`/v1/user-projects/projects/${resolvedParams.id}/users`), {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        if (usersResponse.ok) {
          const projectUsersData = await usersResponse.json();
          if (Array.isArray(projectUsersData)) {
            setProjectUsers(projectUsersData);
          }
        }
        
        toast.success(`${userName} adicionado ao projeto!`);
        
        // Remover animação após 2 segundos
        setTimeout(() => {
          setJustAddedUser(null);
        }, 2000);
      } else {
        const errorData = await response.text();
        console.error("Erro ao adicionar usuário:", errorData);
        toast.error("Erro ao adicionar usuário ao projeto");
      }
    } catch (error) {
      console.error("Error adding user to project:", error);
      setError("Erro ao adicionar usuário ao projeto");
    } finally {
      setAddingUser(null);
    }
  };

  // Função para remover usuário do projeto
  const removeUserFromProject = async (userId: string) => {
    if (!token) return;
    
    // Encontrar o nome do usuário para exibir na confirmação
    const user = allUsers.find((u: any) => String(u.id) === userId);
    const userName = user?.name || user?.username || user?.email || "usuário";
    
    // Mostrar toast de confirmação
    toast.warning(`Remover ${userName} do projeto?`, {
      description: "Esta ação não pode ser desfeita.",
      action: {
        label: "Remover",
        onClick: async () => {
          setRemovingUser(userId);
          try {
            const response = await fetch(buildApiUrl(`/v1/user-projects/projects/${resolvedParams.id}/users/${userId}`), {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            });

            if (response.ok) {
              // Recarregar lista de usuários do projeto
              const usersResponse = await fetch(buildApiUrl(`/v1/user-projects/projects/${resolvedParams.id}/users`), {
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": "application/json"
                }
              });
              if (usersResponse.ok) {
                const projectUsersData = await usersResponse.json();
                if (Array.isArray(projectUsersData)) {
                  setProjectUsers(projectUsersData);
                }
              }
              toast.success(`${userName} removido do projeto com sucesso!`);
            } else {
              const errorData = await response.text();
              console.error("Erro ao remover usuário:", errorData);
              toast.error("Erro ao remover usuário do projeto");
            }
          } catch (error) {
            console.error("Error removing user from project:", error);
            toast.error("Erro ao remover usuário do projeto");
          } finally {
            setRemovingUser(null);
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

  // Verificar se usuário já está no projeto
  const isUserInProject = (userId: string) => {
    return projectUsers.some((pu: any) => {
      const puUserId = pu.user_id || pu.user?.id || pu.id;
      return String(puUserId) === String(userId);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!startDate) {
        setError("Data de início é obrigatória");
        setSaving(false);
        return;
      }

      if (!budget || isNaN(parseFloat(budget)) || parseFloat(budget) <= 0) {
        setError("Orçamento deve ser um valor numérico maior que zero");
        setSaving(false);
        return;
      }

      const projectData = {
        name,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        budget: parseFloat(budget),
        status,
      };

      console.log('Enviando dados de atualização:', projectData);

      const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS_V1)}/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        router.push(`/projects/${resolvedParams.id}`);
      } else {
        const errorData = await response.json();
        console.error('Erro do servidor:', errorData);
        setError(`Erro ao atualizar projeto: ${errorData.error || 'Erro desconhecido'}`);
        setSaving(false);
      }
    } catch (error) {
      console.error("Error updating project:", error);
      setError("Erro ao atualizar projeto. Verifique a conexão com o servidor.");
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/4 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-32 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Editar Projeto</CardTitle>
          <CardDescription>Atualize os detalhes do projeto</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome do projeto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Descreva os objetivos e escopo do projeto"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data Final (opcional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Orçamento (R$) *</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planejamento</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Membros da Equipe</Label>
              <div className="border rounded-md p-3 max-h-64 overflow-y-auto">
                {loadingTeamMembers ? (
                  <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                ) : !Array.isArray(allUsers) || allUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum usuário disponível. 
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => router.push("/users/new")}
                    >
                      Adicionar novo usuário
                    </Button>
                  </p>
                ) : (
                  <div className="space-y-2">
                    {allUsers.map((user: any) => {
                        const userId = String(user.id);
                        const isInProject = isUserInProject(userId);
                        const userName = user.name || user.username || user.email;
                        
                        const isJustAdded = justAddedUser === userId;
                      
                      return (
                        <div 
                          key={user.id} 
                          className={`flex items-center justify-between py-2 px-2 rounded-md transition-all duration-300 border-b last:border-b-0 ${
                            isInProject 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-transparent'
                          } ${
                            isJustAdded 
                              ? 'animate-pulse bg-green-100 border-green-300' 
                              : ''
                          }`}
                        >
                          <div className="flex-1">
                            <p className={`text-sm font-medium transition-colors ${
                              isInProject 
                                ? 'text-green-700' 
                                : isJustAdded 
                                  ? 'text-green-600 animate-pulse' 
                                  : ''
                            }`}>
                              {userName}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                            {isInProject ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeUserFromProject(userId)}
                                disabled={removingUser === userId}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Remover do projeto"
                              >
                                {removingUser === userId ? (
                                  <span className="text-xs animate-pulse">...</span>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addUserToProject(userId)}
                                disabled={addingUser === userId}
                                className="h-8 w-8 p-0"
                                title="Adicionar ao projeto"
                              >
                                {addingUser === userId ? (
                                  <span className="text-xs animate-pulse">...</span>
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                        </div>
                      );
                    })}
                    {allUsers.filter((user: any) => isUserInProject(String(user.id))).length === 0 && allUsers.length > 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Nenhum usuário adicionado ao projeto ainda.
                      </p>
                    )}
                    {allUsers.filter((user: any) => isUserInProject(String(user.id))).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum usuário adicionado ao projeto ainda.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/projects/${resolvedParams.id}`)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 