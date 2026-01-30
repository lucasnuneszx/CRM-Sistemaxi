'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pencil, Trash, Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { buildApiUrl, API_CONFIG } from '@/config/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  setorId?: string;
  setor?: {
    id: string;
    nome: string;
  };
  foto_perfil?: string;
}

export default function UsersPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  // Buscar usuários
  useEffect(() => {
    if (!token || fetchingRef.current) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      fetchingRef.current = true;
      setLoading(true);
      try {
        // Buscar usuários
        const usersResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USERS), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
        });

        if (!usersResponse.ok) {
          throw new Error('Falha ao carregar usuários');
        }

        const usersData = await usersResponse.json();
        setUsers(usersData);
      } catch (err) {
        console.error('Erro:', err);
        setError('Não foi possível carregar os dados. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchData();
  }, [token]);

  // Excluir usuário
  const handleDelete = async (id: string) => {
    const userToDelete = users.find(u => u.id === id);
    const userName = userToDelete?.name || 'este usuário';
    
    const confirmMessage = `Tem certeza que deseja excluir ${userName}?\n\n` +
      `Os leads e criativos criados por este usuário serão transferidos automaticamente para um administrador.\n\n` +
      `Esta ação não pode ser desfeita.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.USERS)}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        let errorMessage = 'Erro ao excluir usuário';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Atualizar a lista retirando o usuário excluído
      setUsers(users.filter(user => user.id !== id));
      setSuccessMessage(`Usuário ${userName} excluído com sucesso!`);
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      const errorMsg = err instanceof Error ? err.message : 'Erro ao excluir usuário';
      setError(errorMsg);
      
      // Limpar erro após 5 segundos
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  // Navegação para página de adição de usuário
  const handleAddNew = () => {
    router.push('/users/new');
  };

  // Navegação para página de edição de usuário
  const handleEdit = (userId: string) => {
    router.push(`/users/${userId}/edit`);
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Data inválida";
      return date.toLocaleDateString('pt-BR');
    } catch {
      return "Data inválida";
    }
  };

  // Função para obter iniciais
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar Usuário
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-4 bg-green-900/50 border-green-500">
          <AlertDescription className="text-green-200">{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-2">Carregando usuários...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-row items-center gap-3">
                            {(() => {
                              // Verificar se há foto válida
                              const hasValidPhoto = user.foto_perfil && 
                                                   typeof user.foto_perfil === 'string' && 
                                                   user.foto_perfil.trim() !== '' &&
                                                   (user.foto_perfil.startsWith('http://') || 
                                                    user.foto_perfil.startsWith('https://') ||
                                                    user.foto_perfil.startsWith('/'));
                              
                              return hasValidPhoto ? (
                                <img
                                  key={`photo-${user.id}`}
                                  src={user.foto_perfil}
                                  alt={user.name}
                                  className="h-10 w-10 rounded-full object-cover border-2 border-border flex-shrink-0 order-first"
                                  onError={(e) => {
                                    // Fallback para iniciais se a imagem falhar
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent && !parent.querySelector('.avatar-fallback')) {
                                      const fallback = document.createElement('div');
                                      fallback.className = 'avatar-fallback h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0 order-first';
                                      fallback.textContent = getInitials(user.name);
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0 order-first">
                                  {getInitials(user.name)}
                                </div>
                              );
                            })()}
                            <span className="font-medium order-last">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.setor?.nome || "Não atribuído"}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(user.id)}>
                            <Pencil className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>
                            <Trash className="h-4 w-4 mr-1" /> Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              Nota: Para administrar usuários, você precisa ser um administrador do sistema. 
              O usuário administrador padrão é admin@sistemaxi.com com senha admin123.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}