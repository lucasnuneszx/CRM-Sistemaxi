'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Pencil, 
  Trash, 
  Plus,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from '@/config/api';

interface Setor {
  id: string;
  nome: string;
  descricao?: string;
  createdAt: string;
  updatedAt: string;
  usuarios?: Usuario[];
}

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Schema para validação do formulário
const setorSchema = z.object({
  nome: z.string().min(3, {
    message: "O nome do setor deve ter pelo menos 3 caracteres",
  }),
  descricao: z.string().optional(),
});

export default function SetoresPage() {
  const { token } = useAuth();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSetor, setCurrentSetor] = useState<Setor | null>(null);

  // Configuração do formulário
  const form = useForm<z.infer<typeof setorSchema>>({
    resolver: zodResolver(setorSchema),
    defaultValues: {
      nome: "",
      descricao: "",
    },
  });

  // Buscar setores
  useEffect(() => {
    // Evitar chamadas se não há token válido
    if (!token || token.length < 10) {
      return;
    }

    const fetchSetores = async () => {
      setLoading(true);
      setError(null); // Limpar erro anterior
      
      try {
        console.log('🔍 Buscando setores com token:', token.substring(0, 20) + '...');
        
        const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.SECTORS)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
        });

        console.log('📡 Resposta setores:', response.status, response.statusText);

        if (!response.ok) {
          throw new Error('Falha ao carregar setores');
        }

        const data = await response.json();
        console.log('✅ Setores carregados:', data.length, 'itens');
        setSetores(data);
      } catch (err) {
        console.error('❌ Erro ao buscar setores:', err);
        setError('Não foi possível carregar os setores. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchSetores();
  }, [token]);

  // Lidar com a submissão do formulário
  const onSubmit = async (values: z.infer<typeof setorSchema>) => {
    setIsSubmitting(true);
    try {
      const url = currentSetor 
        ? `${buildApiUrl(API_CONFIG.ENDPOINTS.SECTORS)}/${currentSetor.id}` 
        : buildApiUrl(API_CONFIG.ENDPOINTS.SECTORS);
      
      const method = currentSetor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar setor');
      }

      // Atualizar a lista de setores
      const updatedResponse = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.SECTORS)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setSetores(updatedData);
      }

      setOpenDialog(false);
      form.reset();
      setCurrentSetor(null);
    } catch (err) {
      console.error('Erro ao salvar setor:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar setor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Editar setor
  const handleEdit = (setor: Setor) => {
    setCurrentSetor(setor);
    form.reset({
      nome: setor.nome,
      descricao: setor.descricao || "",
    });
    setOpenDialog(true);
  };

  // Excluir setor
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este setor?')) {
      return;
    }
    
    try {
      const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.SECTORS)}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir setor');
      }

      // Atualizar a lista retirando o setor excluído
      setSetores(setores.filter(setor => setor.id !== id));
    } catch (err) {
      console.error('Erro ao excluir setor:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir setor');
    }
  };

  // Abrir formulário para novo setor
  const handleAddNew = () => {
    setCurrentSetor(null);
    form.reset({
      nome: "",
      descricao: "",
    });
    setOpenDialog(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciamento de Setores</h1>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar Setor
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Setores do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-2">Carregando setores...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {setores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Nenhum setor encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  setores.map((setor) => (
                    <TableRow key={setor.id}>
                      <TableCell className="font-medium">{setor.nome}</TableCell>
                      <TableCell>{setor.descricao || "-"}</TableCell>
                      <TableCell>{setor.usuarios?.length || 0} usuários</TableCell>
                      <TableCell>{new Date(setor.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(setor)}>
                            <Pencil className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(setor.id)}>
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
        </CardContent>
      </Card>

      {/* Dialog para adicionar/editar setor */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentSetor ? "Editar Setor" : "Adicionar Setor"}</DialogTitle>
            <DialogDescription>
              Preencha os dados do setor abaixo:
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Setor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do setor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição detalhada do setor (opcional)" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setOpenDialog(false);
                    form.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentSetor ? "Atualizar" : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 