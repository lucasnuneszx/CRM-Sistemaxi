"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { buildApiUrl, API_CONFIG } from '@/config/api';
import { toast } from "sonner";



export default function NewProjectPage() {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("planning");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(true);
  const [justAddedUser, setJustAddedUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Prevenir reenvio automático do formulário após refresh
  useEffect(() => {
    // Limpar qualquer estado de submissão ao montar o componente
    setIsSubmitting(false);
    setLoading(false);
    
    // Limpar qualquer flag de submissão pendente do sessionStorage
    const pendingSubmission = sessionStorage.getItem('project_submission_pending');
    if (pendingSubmission) {
      try {
        const submissionData = JSON.parse(pendingSubmission);
        // Verificar se a submissão é muito antiga (mais de 5 minutos)
        const isExpired = Date.now() - submissionData.timestamp > 5 * 60 * 1000;
        if (isExpired) {
          sessionStorage.removeItem('project_submission_pending');
        } else {
          sessionStorage.removeItem('project_submission_pending');
          setError("Uma submissão anterior foi detectada. Por favor, preencha o formulário novamente.");
        }
      } catch (e) {
        // Se não for JSON, tratar como string antiga
        if (pendingSubmission === 'true') {
          sessionStorage.removeItem('project_submission_pending');
          setError("Uma submissão anterior foi detectada. Por favor, preencha o formulário novamente.");
        }
      }
    }
    
    // Prevenir comportamento padrão de reenvio do navegador
    const handleBeforeUnload = () => {
      // Limpar flag ao sair da página
      sessionStorage.removeItem('project_submission_pending');
    };
    
    // Prevenir reenvio automático do formulário
    const handlePageshow = (e: PageTransitionEvent) => {
      // Se a página foi carregada do cache (back/forward), limpar flags
      if (e.persisted) {
        sessionStorage.removeItem('project_submission_pending');
        setIsSubmitting(false);
        setLoading(false);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pageshow', handlePageshow);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pageshow', handlePageshow);
    };
  }, []);

  useEffect(() => {
    if (!token) return;

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

    fetchAllUsers();
  }, [token]);

  // Função para adicionar usuário à lista de selecionados
  const addUserToSelection = (userId: string) => {
    try {
      // Validar userId
      if (!userId || typeof userId !== 'string') {
        console.error('ID de usuário inválido:', userId);
        toast.error("Erro ao adicionar usuário", { description: "ID de usuário inválido" });
        return;
      }

      // Verificar se já está selecionado
      if (selectedUsers.includes(userId)) {
        return; // Já está selecionado, não fazer nada
      }

      // Adicionar à lista de selecionados
      setSelectedUsers(prev => {
        // Verificar novamente para evitar duplicatas
        if (prev.includes(userId)) {
          return prev;
        }
        return [...prev, userId];
      });
      
      // Ativar animação
      setJustAddedUser(userId);
      
      // Remover animação após 2 segundos
      setTimeout(() => {
        setJustAddedUser(null);
      }, 2000);

      // Feedback visual (opcional)
      const userName = allUsers.find(u => String(u.id) === userId)?.name || 'Usuário';
      toast.success(`${userName} adicionado à seleção`, { duration: 2000 });
    } catch (error: any) {
      console.error('Erro ao adicionar usuário à seleção:', error);
      toast.error("Erro ao adicionar usuário", { 
        description: error.message || "Erro desconhecido" 
      });
    }
  };

  // Função para remover usuário da lista de selecionados
  const removeUserFromSelection = (userId: string) => {
    try {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      
      // Feedback visual (opcional)
      const userName = allUsers.find(u => String(u.id) === userId)?.name || 'Usuário';
      toast.info(`${userName} removido da seleção`, { duration: 2000 });
    } catch (error: any) {
      console.error('Erro ao remover usuário da seleção:', error);
      toast.error("Erro ao remover usuário", { 
        description: error.message || "Erro desconhecido" 
      });
    }
  };

  // Verificar se usuário está selecionado
  const isUserSelected = (userId: string) => {
    return selectedUsers.includes(userId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevenir múltiplas submissões
    if (isSubmitting || loading) {
      return;
    }
    
    // Verificar se há uma submissão pendente (evitar reenvio após refresh)
    const pendingSubmission = sessionStorage.getItem('project_submission_pending');
    if (pendingSubmission) {
      try {
        const submissionData = JSON.parse(pendingSubmission);
        // Verificar se a submissão é muito antiga (mais de 5 minutos)
        const isExpired = Date.now() - submissionData.timestamp > 5 * 60 * 1000;
        if (!isExpired) {
          // Limpar a flag e não permitir submissão
          sessionStorage.removeItem('project_submission_pending');
          setError("Uma submissão anterior foi detectada. Por favor, preencha o formulário novamente.");
          setLoading(false);
          setIsSubmitting(false);
          return;
        } else {
          // Submissão expirada, limpar e permitir nova submissão
          sessionStorage.removeItem('project_submission_pending');
        }
      } catch (e) {
        // Se não for JSON, tratar como string antiga
        if (pendingSubmission === 'true') {
          sessionStorage.removeItem('project_submission_pending');
          setError("Uma submissão anterior foi detectada. Por favor, preencha o formulário novamente.");
          setLoading(false);
          setIsSubmitting(false);
          return;
        }
      }
    }
    
    // Verificar se já está submetendo (proteção adicional)
    if (isSubmitting || loading) {
      return;
    }
    
    // Marcar que há uma submissão em andamento (com timestamp para expiração)
    const submissionData = {
      timestamp: Date.now(),
      projectName: name
    };
    sessionStorage.setItem('project_submission_pending', JSON.stringify(submissionData));
    
    setIsSubmitting(true);
    setLoading(true);
    setError(null);

    try {
      // Validações básicas
      if (!name || !name.trim()) {
        setError("Nome do projeto é obrigatório");
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      if (!startDate) {
        setError("Data de início é obrigatória");
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      if (!budget || isNaN(parseFloat(budget)) || parseFloat(budget) <= 0) {
        setError("Orçamento deve ser um valor numérico maior que zero");
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      // Validar formato da data
      try {
        new Date(startDate);
      } catch (e) {
        setError("Data de início inválida");
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      if (endDate) {
        try {
          const start = new Date(startDate);
          const end = new Date(endDate);
          if (end < start) {
            setError("Data final deve ser posterior à data de início");
            setLoading(false);
            setIsSubmitting(false);
            return;
          }
        } catch (e) {
          setError("Data final inválida");
          setLoading(false);
          setIsSubmitting(false);
          return;
        }
      }

      // Preparar dados do projeto
      const projectData: any = {
        name: name.trim(),
        description: description?.trim() || null,
        startDate: new Date(startDate).toISOString(),
        budget: parseFloat(budget),
        status: status || "planning",
      };

      // Adicionar endDate apenas se fornecido
      if (endDate && endDate.trim()) {
        projectData.endDate = new Date(endDate).toISOString();
      }

      // Verificar se o token está disponível
      if (!token) {
        throw new Error("Token de autenticação não encontrado. Por favor, faça login novamente.");
      }

      const apiUrl = buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS_V1);
      
      // Verificar se a URL está correta
      if (!apiUrl || !apiUrl.includes('http')) {
        throw new Error("URL da API inválida. Verifique a configuração.");
      }

      // Criar um AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(projectData),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Erro de rede (Failed to fetch)
        console.error("Erro de rede ao criar projeto:", fetchError.message);
        
        // Verificar se foi abortado por timeout
        if (fetchError.name === 'AbortError') {
          throw new Error("A requisição demorou muito para responder. Verifique se o servidor está acessível.");
        }
        
        // Verificar se é erro de CORS
        if (fetchError.message?.includes('CORS') || fetchError.message?.includes('cors')) {
          throw new Error("Erro de CORS. Verifique a configuração do servidor.");
        }
        
        // Erro genérico de conexão
        throw new Error(
          fetchError.message?.includes('fetch') || fetchError.message?.includes('network')
            ? "Não foi possível conectar ao servidor. Verifique se o servidor está rodando e acessível."
            : `Erro de conexão: ${fetchError.message || 'Erro desconhecido'}`
        );
      }

      // Verificar se a resposta foi bem-sucedida ANTES de processar
      if (!response.ok) {
        // Tentar ler a mensagem de erro do servidor
        let errorMessage = "Erro ao criar projeto";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // Se não conseguir ler JSON, usar o status
          errorMessage = `Erro ao criar projeto (${response.status}: ${response.statusText})`;
        }
        
        // Limpar flag de submissão pendente em caso de erro
        sessionStorage.removeItem('project_submission_pending');
        
        console.error('Erro ao criar projeto:', response.status, errorMessage);
        setError(errorMessage);
        setLoading(false);
        setIsSubmitting(false);
        
        // IMPORTANTE: Retornar aqui para NÃO criar o projeto
        return;
      }

      // Só processar se response.ok === true
      let createdProject;
      try {
        createdProject = await response.json();
      } catch (parseError) {
        // Se não conseguir parsear a resposta, considerar erro
        console.error('Erro ao processar resposta do servidor:', parseError);
        sessionStorage.removeItem('project_submission_pending');
        setError("Erro ao processar resposta do servidor. O projeto pode não ter sido criado.");
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      // Verificar se o projeto foi realmente criado
      if (!createdProject || !createdProject.id) {
        console.error('Erro: Projeto criado mas sem ID válido');
        sessionStorage.removeItem('project_submission_pending');
        setError("Erro: Projeto criado mas sem ID válido.");
        setLoading(false);
        setIsSubmitting(false);
        return;
      }
      
      const projectId = String(createdProject.id);
      
      // Adicionar usuários selecionados ao projeto
      if (selectedUsers.length > 0) {
        try {
          
          const addUserPromises = selectedUsers.map(async (userId) => {
            try {
              const userResponse = await fetch(buildApiUrl(`/v1/user-projects/projects/${projectId}/users`), {
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
              
              if (!userResponse.ok) {
                const errorText = await userResponse.text();
                console.error(`Erro ao adicionar usuário ${userId} ao projeto:`, errorText);
                throw new Error(`Erro ao adicionar usuário: ${errorText}`);
              }
              
              return await userResponse.json();
            } catch (err) {
              console.error(`Erro ao adicionar usuário ${userId}:`, err);
              throw err;
            }
          });
          
          await Promise.all(addUserPromises);
        } catch (err: any) {
          console.error("❌ Erro ao adicionar usuários ao projeto:", err);
          // Se houver erro ao adicionar usuários, mostrar aviso mas continuar
          // O projeto já foi criado, então não vamos reverter isso
          toast.warning("Projeto criado, mas alguns usuários não puderam ser adicionados", {
            description: err.message || "Verifique os logs para mais detalhes"
          });
          // Continuar mesmo com erro ao adicionar usuários - projeto já foi criado
        }
      }
      
      // IMPORTANTE: Só chegar aqui se o projeto foi criado com sucesso
      // Se houver qualquer erro antes disso, o código já terá retornado
      
      // Limpar flag de submissão pendente
      sessionStorage.removeItem('project_submission_pending');
      
      toast.success(`Projeto "${name}" criado com sucesso!`);
      
      // Limpar formulário antes de redirecionar
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setBudget("");
      setStatus("planning");
      setSelectedUsers([]);
      setIsSubmitting(false);
      setLoading(false);
      
      // Redirecionar apenas se tudo estiver OK
      router.push(`/projects/${projectId}`);
    } catch (error: any) {
      // Limpar flag de submissão pendente em caso de erro
      sessionStorage.removeItem('project_submission_pending');
      
      console.error("Error creating project:", error);
      
      // Mensagem de erro mais específica
      let errorMessage = "Erro ao criar projeto. Verifique a conexão com o servidor.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = "Erro de conexão. Verifique se o servidor está rodando e acessível.";
      }
      
      setError(errorMessage);
      setLoading(false);
      setIsSubmitting(false);
      
      toast.error("Erro ao criar projeto", {
        description: errorMessage
      });
    }
  };


  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Novo Projeto</CardTitle>
          <CardDescription>Crie um novo projeto de marketing</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} method="post" noValidate>
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
                      const isSelected = isUserSelected(userId);
                      const userName = user.name || user.username || user.email;
                      const isJustAdded = justAddedUser === userId;
                      
                      return (
                        <div 
                          key={user.id} 
                          className={`flex items-center justify-between py-2 px-2 rounded-md transition-all duration-300 border-b last:border-b-0 ${
                            isSelected 
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
                              isSelected 
                                ? 'text-green-700' 
                                : isJustAdded 
                                  ? 'text-green-600 animate-pulse' 
                                  : ''
                            }`}>
                              {userName}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          {isSelected ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeUserFromSelection(userId)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Remover da seleção"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addUserToSelection(userId)}
                              className="h-8 w-8 p-0"
                              title="Adicionar ao projeto"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    {selectedUsers.length === 0 && allUsers.length > 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Nenhum usuário selecionado ainda.
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
              onClick={() => router.push("/projects")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || isSubmitting}>
              {loading || isSubmitting ? "Salvando..." : "Criar Projeto"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 