"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, UserPlus, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buildApiUrl } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
}

interface ProjectUser {
  id: string;
  user_id: string;
  project_id: string;
  role: "project_manager" | "creative_user";
  user?: User;
}

interface UserProjectManagerProps {
  projectId: string;
  canManage?: boolean;
}

const roleConfig = {
  project_manager: {
    label: "Gerente de Projeto",
    description: "Acesso total ao projeto",
    icon: Shield,
    color: "bg-blue-100 text-blue-800"
  },
  creative_user: {
    label: "Usuário Criativo",
    description: "Acesso apenas aos criativos",
    icon: Palette,
    color: "bg-purple-100 text-purple-800"
  }
};

export function UserProjectManager({ projectId, canManage = false }: UserProjectManagerProps) {
  const { token } = useAuth();
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("creative_user");
  const [submitting, setSubmitting] = useState(false);

  // Fetch project users
  const fetchProjectUsers = async () => {
    try {
      const response = await fetch(buildApiUrl(`/v1/user-projects/projects/${projectId}/users`), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjectUsers(data);
      } else {
        console.error("Erro ao carregar usuários do projeto");
      }
    } catch (error) {
      console.error("Erro ao carregar usuários do projeto:", error);
    }
  };

  // Fetch available users
  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(buildApiUrl("/v1/users"), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out users already in project
        const assignedUserIds = projectUsers.map(pu => pu.user_id);
        const available = data.filter((user: User) => !assignedUserIds.includes(user.id));
        setAvailableUsers(available);
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  useEffect(() => {
    if (token && projectId) {
      fetchProjectUsers();
    }
  }, [token, projectId]);

  useEffect(() => {
    if (isModalOpen && canManage) {
      fetchAvailableUsers();
    }
  }, [isModalOpen, canManage, projectUsers]);

  // Assign user to project
  const assignUser = async () => {
    if (!selectedUser || !selectedRole) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`/v1/user-projects/projects/${projectId}/users`), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: selectedUser,
          role: selectedRole
        })
      });

      if (response.ok) {
        await fetchProjectUsers();
        setIsModalOpen(false);
        setSelectedUser("");
        setSelectedRole("creative_user");
      } else {
        const errorData = await response.text();
        setError("Erro ao atribuir usuário ao projeto");
      }
    } catch (error) {
      setError("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  // Remove user from project
  const removeUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário do projeto?")) return;

    try {
      const response = await fetch(buildApiUrl(`/v1/user-projects/projects/${projectId}/users/${userId}`), {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        await fetchProjectUsers();
      } else {
        setError("Erro ao remover usuário do projeto");
      }
    } catch (error) {
      setError("Erro de conexão");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Usuários do Projeto
          </CardTitle>
          {canManage && (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Atribuir Usuário ao Projeto</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Usuário</label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Função</label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleConfig).map(([role, config]) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              <config.icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{config.label}</div>
                                <div className="text-xs text-muted-foreground">{config.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={assignUser} 
                      disabled={!selectedUser || submitting}
                    >
                      {submitting ? "Atribuindo..." : "Atribuir"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {projectUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário atribuído ao projeto
            </div>
          ) : (
            projectUsers.map(projectUser => {
              const config = roleConfig[projectUser.role];
              const Icon = config.icon;
              
              return (
                <div key={projectUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {projectUser.user?.name || "Usuário"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {projectUser.user?.email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={config.color}>
                      {config.label}
                    </Badge>
                    
                    {canManage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeUser(projectUser.user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}